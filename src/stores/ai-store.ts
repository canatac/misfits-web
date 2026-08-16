/**
 * Zustand store for the AI composer assistant.
 *
 * Holds generation state (isGenerating, lastResponse, error) and a
 * recent-interaction history (persisted to localStorage). The action methods
 * delegate to the AI client — `generateEmail` streams token-by-token via an
 * `onChunk` callback so the UI can render text as it arrives.
 */
import { create } from "zustand";
import { AIError } from "@/lib/ai-client";
import {
  generateEmail as clientGenerateEmail,
  generateSubject as clientGenerateSubject,
  rewriteText as clientRewriteText,
  translateText as clientTranslateText,
} from "@/lib/ai-prompts";
import type {
  AIComposerRequest,
  AIConversation,
  AIResponse,
  AITranslationLang,
  AITone,
  AILength,
  ChatMessage,
} from "@/types/ai";

const HISTORY_KEY = "misfits:ai-history";
const MAX_HISTORY = 20;

function uid(prefix = "ai"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadHistory(): AIConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AIConversation[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: AIConversation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY))
    );
  } catch {
    // storage full or unavailable — ignore
  }
}

export interface AIStore {
  /** True while a generation is in flight. */
  isGenerating: boolean;
  /** Most recent successful response. */
  lastResponse: AIResponse | null;
  /** Last error message, if any. */
  error: string | null;
  /** Recent AI interactions (newest first). */
  history: AIConversation[];

  // Actions -----------------------------------------------------------

  /**
   * Generate an email from a composer request, streaming tokens to `onChunk`.
   * Returns the full response once the stream completes.
   */
  generateEmail: (
    req: AIComposerRequest,
    onChunk?: (chunk: string, full: string) => void
  ) => Promise<AIResponse>;

  /** Rewrite the given text in the requested tone / length. */
  rewriteText: (
    text: string,
    opts: { tone?: AITone; length?: AILength }
  ) => Promise<AIResponse>;

  /** Translate the given text into the target language. */
  translateText: (
    text: string,
    target: AITranslationLang
  ) => Promise<AIResponse>;

  /** Generate subject-line suggestions from the email body. */
  generateSubject: (body: string) => Promise<string[]>;

  /** Clear the interaction history (and localStorage). */
  clearHistory: () => void;

  /** Clear the current error. */
  clearError: () => void;
}

function recordInteraction(
  userContent: string,
  assistantContent: string
): AIConversation[] {
  const entry: AIConversation = {
    id: uid("conv"),
    messages: [
      { role: "user", content: userContent },
      { role: "assistant", content: assistantContent },
    ],
    createdAt: new Date().toISOString(),
  };
  return [entry];
}

export const useAIStore = create<AIStore>((set, get) => ({
  isGenerating: false,
  lastResponse: null,
  error: null,
  history: loadHistory(),

  generateEmail: async (req, onChunk) => {
    set({ isGenerating: true, error: null });
    let full = "";
    try {
      const stream = clientGenerateEmail(req, { stream: true });
      for await (const chunk of stream) {
        if (chunk.content) {
          full += chunk.content;
          onChunk?.(chunk.content, full);
        }
      }
      const response: AIResponse = {
        content: full,
        role: "assistant",
        model: "streamed",
      };
      const history = [
        ...recordInteraction(req.prompt, full),
        ...get().history,
      ].slice(0, MAX_HISTORY);
      saveHistory(history);
      set({ isGenerating: false, lastResponse: response, history });
      return response;
    } catch (err) {
      const message =
        err instanceof AIError ? err.message : "AI generation failed.";
      set({ isGenerating: false, error: message });
      throw err;
    }
  },

  rewriteText: async (text, opts) => {
    set({ isGenerating: true, error: null });
    try {
      const response = await clientRewriteText(text, opts);
      const history = [
        ...recordInteraction(
          `Réécrire (${opts.tone ?? "—"} / ${opts.length ?? "—"}): ${text.slice(0, 120)}`,
          response.content
        ),
        ...get().history,
      ].slice(0, MAX_HISTORY);
      saveHistory(history);
      set({ isGenerating: false, lastResponse: response, history });
      return response;
    } catch (err) {
      const message =
        err instanceof AIError ? err.message : "AI rewrite failed.";
      set({ isGenerating: false, error: message });
      throw err;
    }
  },

  translateText: async (text, target) => {
    set({ isGenerating: true, error: null });
    try {
      const response = await clientTranslateText(text, target);
      const history = [
        ...recordInteraction(
          `Traduire en ${target}: ${text.slice(0, 120)}`,
          response.content
        ),
        ...get().history,
      ].slice(0, MAX_HISTORY);
      saveHistory(history);
      set({ isGenerating: false, lastResponse: response, history });
      return response;
    } catch (err) {
      const message =
        err instanceof AIError ? err.message : "AI translation failed.";
      set({ isGenerating: false, error: message });
      throw err;
    }
  },

  generateSubject: async (body) => {
    set({ isGenerating: true, error: null });
    try {
      const subjects = await clientGenerateSubject(body);
      set({ isGenerating: false });
      return subjects;
    } catch (err) {
      const message =
        err instanceof AIError ? err.message : "AI subject generation failed.";
      set({ isGenerating: false, error: message });
      throw err;
    }
  },

  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },

  clearError: () => set({ error: null }),
}));

export type { ChatMessage };
