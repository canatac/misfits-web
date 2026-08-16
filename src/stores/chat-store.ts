"use client";
import { create } from "zustand";
import type { ChatContext, ChatConversation, ChatMessage } from "@/types/chat";
import type { ChatTraceEvent } from "./chat-types";
import { MAX_CONVERSATIONS, loadConversations, saveConversations } from "./chat-persistence";
import { pushTrace } from "./chat-utils";
import {
  resolveSendContext,
  runStandardSend,
  runTraceSend,
} from "./chat-store/send-flows";

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
      const conversations = [conv, ...s.conversations].slice(0, MAX_CONVERSATIONS);
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
      const ctx = resolveSendContext(
        context,
        messages,
        convId!,
        startedAt,
        activeAbortController.signal
      );

      if (!get().traceEnabled) {
        await runStandardSend(set, ctx);
        return;
      }

      await runTraceSend(set, ctx, content, () => get().traceEvents);
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
