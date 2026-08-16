"use client";
import { create } from "zustand";
import type { ChatContext, ChatConversation, ChatMessage } from "@/types/chat";
import type { ChatTraceEvent, TraceLevel } from "./chat-types";
import { chatRepository } from "@/lib/repositories";
import { STORAGE_KEY, MAX_CONVERSATIONS, loadConversations, saveConversations } from "./chat-persistence";
import { toShort, pushTrace, parseSseEventBlocks, extractDataFromBlock } from "./chat-utils";
import { summarizeHermesEvent, buildSourceCitations, deriveConfidence, updateAssistantDraft } from "./chat-helpers";

let activeAbortController: AbortController | null = null;

interface ChatStore {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  isOpen: boolean;
  traceEnabled: boolean;
  traceEvents: ChatTraceEvent[];
  lastLatencyMs: number | null;
  sendMessage: (content: string, context?: ChatContext) => Promise<void>;
  stopStreaming: () => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setTraceEnabled: (enabled: boolean) => void;
  clearTrace: () => void;
  clearAll: () => void;
}

type ChatSetState = (
  partial: Partial<ChatStore> | ((state: ChatStore) => Partial<ChatStore>)
) => void;








export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: loadConversations(),
  activeConversationId: null,
  isStreaming: false,
  error: null,
  isOpen: false,
  traceEnabled: false,
  traceEvents: [],
  lastLatencyMs: null,

  createConversation: () => {
    const id = `chat-${Date.now()}`;
    const conv: ChatConversation = {
      id,
      title: "New conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((s) => {
      const conversations = [conv, ...s.conversations].slice(
        0,
        MAX_CONVERSATIONS
      );
      saveConversations(conversations);
      return { conversations, activeConversationId: id };
    });

    return id;
  },

  sendMessage: async (content: string, context?: ChatContext) => {
    let convId = get().activeConversationId;
    if (!convId) convId = get().createConversation();

    const userMsg: ChatMessage = {
      role: "user",
      content,
      timestamp: Date.now(),
    };

    set((s) => {
      const conversations = s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              title: c.messages.length === 0 ? content.slice(0, 40) : c.title,
              updatedAt: Date.now(),
            }
          : c
      );
      saveConversations(conversations);
      return {
        conversations,
        isStreaming: true,
        error: null,
        traceEvents: s.traceEnabled ? [] : s.traceEvents,
      };
    });

    const startedAt = Date.now();
    activeAbortController?.abort();
    activeAbortController = new AbortController();

    try {
      const messages =
        get().conversations.find((c) => c.id === convId)?.messages || [];
      const resolvedThreadId = context?.threadId ?? context?.currentEmailId;
      const resolvedUserId = context?.userId;
      const resolvedSessionId =
        context?.sessionId ??
        (resolvedThreadId ? `mail-thread-${resolvedThreadId}` : undefined);
      const resolvedSessionKey =
        context?.sessionKey ??
        (resolvedUserId ? `user-${resolvedUserId}` : undefined);
      const attachmentContextNote =
        (context?.attachmentNames?.length ?? 0) > 0
          ? `Pièces jointes du mail courant: ${(context?.attachmentNames ?? []).join(", ")}. Si nécessaire, demande d'ouvrir la pièce jointe ciblée.`
          : "Aucune pièce jointe signalée dans le contexte.";

      if (!get().traceEnabled) {
        const data = await chatRepository.postChat(
          {
            messages: [
              {
                role: "system",
                content: `You are a helpful email assistant for misfits.ai Mail. Answer concisely in French or English. ${attachmentContextNote}`,
              },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            threadId: resolvedThreadId,
            userId: resolvedUserId,
            sessionId: resolvedSessionId,
            sessionKey: resolvedSessionKey,
          },
          activeAbortController.signal
        );

        const assistantContent =
          data?.choices?.[0]?.message?.content ||
          data?.content ||
          "Sorry, I could not generate a response.";

        const sources = buildSourceCitations(context);
        const confidence = deriveConfidence("standard", []);
        const latencyMs = Date.now() - startedAt;
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
          metadata: {
            ...confidence,
            sources,
            latencyMs,
          },
        };

        set((s) => {
          const conversations = s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, assistantMsg],
                  updatedAt: Date.now(),
                }
              : c
          );
          saveConversations(conversations);
          return {
            conversations,
            isStreaming: false,
            lastLatencyMs: latencyMs,
          };
        });
        return;
      }

      // Trace mode: Hermes runs API + SSE event stream (closer to CLI progress).
      pushTrace(set, {
        kind: "trace.start",
        message: "Démarrage run Hermes…",
        level: "info",
      });

      const history = messages
        .slice(-12)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const runInput = [
        "Tu es l'assistant email de misfits.ai Mail. Réponds de façon concise en français ou anglais.",
        attachmentContextNote,
        history ? `Historique:\n${history}` : "",
        `Question actuelle:\n${content}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const runData = await chatRepository.createRun(
        {
          input: runInput,
          model: "hermes-agent",
          threadId: resolvedThreadId,
          userId: resolvedUserId,
          sessionId: resolvedSessionId,
          sessionKey: resolvedSessionKey,
        },
        activeAbortController.signal
      );
      const runId: string | undefined = runData?.run_id || runData?.id;
      if (!runId) {
        throw new Error("Hermes run id missing");
      }

      pushTrace(set, {
        kind: "run.started",
        message: `run_id=${runId}`,
        level: "info",
      });

      const traceSources = buildSourceCitations(context);

      // Start assistant draft bubble immediately.
      set((s) => {
        const conversations = updateAssistantDraft(
          s.conversations,
          convId!,
          "",
          {
            sources: traceSources,
            confidence: "medium",
            confidenceReason: "Réponse en cours de génération.",
          }
        );
        saveConversations(conversations);
        return { conversations };
      });

      const eventsBody = await chatRepository.streamRunEvents(
        runId,
        activeAbortController.signal
      );

      const reader = eventsBody.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { rest, blocks } = parseSseEventBlocks(buffer);
        buffer = rest;

        for (const block of blocks) {
          const dataLines = extractDataFromBlock(block);
          for (const line of dataLines) {
            if (!line || line === "[DONE]") continue;

            let payload: Record<string, unknown> | null = null;
            try {
              payload = JSON.parse(line) as Record<string, unknown>;
            } catch {
              pushTrace(set, {
                kind: "sse.parse",
                message: `chunk: ${toShort(line)}`,
                level: "warn",
              });
              continue;
            }

            const summary = summarizeHermesEvent(payload);
            pushTrace(set, summary);

            if (
              payload.event === "message.delta" &&
              typeof payload.delta === "string"
            ) {
              assistantContent += payload.delta;
              set((s) => {
                const conversations = updateAssistantDraft(
                  s.conversations,
                  convId!,
                  assistantContent,
                  {
                    sources: traceSources,
                    confidence: "medium",
                    confidenceReason: "Streaming en cours.",
                  }
                );
                saveConversations(conversations);
                return { conversations };
              });
            }

            if (
              payload.event === "run.completed" &&
              !assistantContent &&
              typeof payload.output === "string"
            ) {
              assistantContent = payload.output;
              set((s) => {
                const conversations = updateAssistantDraft(
                  s.conversations,
                  convId!,
                  assistantContent,
                  {
                    sources: traceSources,
                    confidence: "medium",
                    confidenceReason: "Streaming en cours.",
                  }
                );
                saveConversations(conversations);
                return { conversations };
              });
            }
          }
        }
      }

      if (!assistantContent.trim()) {
        assistantContent = "(Aucune sortie assistant)";
        set((s) => {
          const conversations = updateAssistantDraft(
            s.conversations,
            convId!,
            assistantContent
          );
          saveConversations(conversations);
          return { conversations };
        });
      }

      const finalConfidence = deriveConfidence("trace", get().traceEvents);
      const latencyMs = Date.now() - startedAt;
      set((s) => {
        const conversations = updateAssistantDraft(
          s.conversations,
          convId!,
          assistantContent,
          {
            sources: traceSources,
            ...finalConfidence,
            latencyMs,
          }
        );
        saveConversations(conversations);
        return { conversations, isStreaming: false, lastLatencyMs: latencyMs };
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isStreaming: false, error: null });
        pushTrace(set, {
          kind: "trace.aborted",
          message: "Exécution interrompue par l'utilisateur",
          level: "warn",
        });
        return;
      }
      set({ isStreaming: false, error: "Failed to get Hermes response" });
      pushTrace(set, {
        kind: "trace.error",
        message: "Échec récupération réponse Hermes",
        level: "error",
      });
    } finally {
      activeAbortController = null;
    }
  },

  stopStreaming: () => {
    activeAbortController?.abort();
    activeAbortController = null;
    set({ isStreaming: false });
  },

  deleteConversation: (id) => {
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      saveConversations(conversations);
      return {
        conversations,
        activeConversationId:
          s.activeConversationId === id ? null : s.activeConversationId,
      };
    });
  },

  selectConversation: (id) => set({ activeConversationId: id }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  setTraceEnabled: (enabled) => set({ traceEnabled: enabled }),
  clearTrace: () => set({ traceEvents: [] }),
  clearAll: () => {
    saveConversations([]);
    set({ conversations: [], activeConversationId: null, traceEvents: [] });
  },
}));
