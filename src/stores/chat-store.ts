"use client";
import { create } from "zustand";
import type { ChatContext, ChatConversation, ChatMessage } from "@/types/chat";

const STORAGE_KEY = "mfa.chat";
const MAX_CONVERSATIONS = 10;

interface ChatStore {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  isOpen: boolean;
  sendMessage: (content: string, context?: ChatContext) => Promise<void>;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  clearAll: () => void;
}

function loadConversations(): ChatConversation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(conversations: ChatConversation[]) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS))); } catch {}
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: loadConversations(),
  activeConversationId: null,
  isStreaming: false,
  error: null,
  isOpen: false,

  createConversation: () => {
    const id = `chat-${Date.now()}`;
    const conv: ChatConversation = { id, title: "New conversation", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
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

    const userMsg: ChatMessage = { role: "user", content, timestamp: Date.now() };
    set((s) => {
      const conversations = s.conversations.map((c) =>
        c.id === convId ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? content.slice(0, 40) : c.title, updatedAt: Date.now() } : c
      );
      saveConversations(conversations);
      return { conversations, isStreaming: true, error: null };
    });

    try {
      const messages = get().conversations.find((c) => c.id === convId)?.messages || [];
      const resolvedThreadId = context?.threadId ?? context?.currentEmailId;
      const resolvedUserId = context?.userId;
      const resolvedSessionId =
        context?.sessionId ??
        (resolvedThreadId ? `mail-thread-${resolvedThreadId}` : undefined);
      const resolvedSessionKey =
        context?.sessionKey ??
        (resolvedUserId ? `user-${resolvedUserId}` : undefined);

      const res = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful email assistant for misfits.ai Mail. Answer concisely in French or English.",
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          threadId: resolvedThreadId,
          userId: resolvedUserId,
          sessionId: resolvedSessionId,
          sessionKey: resolvedSessionKey,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Hermes request failed");
        throw new Error(errorText || `Hermes request failed (${res.status})`);
      }

      const data = await res.json();
      const assistantContent =
        data?.choices?.[0]?.message?.content ||
        data?.content ||
        "Sorry, I could not generate a response.";
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: assistantContent,
        timestamp: Date.now(),
      };
      set((s) => {
        const conversations = s.conversations.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() } : c,
        );
        saveConversations(conversations);
        return { conversations, isStreaming: false };
      });
    } catch {
      set({ isStreaming: false, error: "Failed to get Hermes response" });
    }
  },

  deleteConversation: (id) => {
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      saveConversations(conversations);
      return { conversations, activeConversationId: s.activeConversationId === id ? null : s.activeConversationId };
    });
  },

  selectConversation: (id) => set({ activeConversationId: id }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
  clearAll: () => { saveConversations([]); set({ conversations: [], activeConversationId: null }); },
}));
