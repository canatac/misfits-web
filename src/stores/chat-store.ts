"use client";
import { create } from "zustand";
import type { ChatConversation, ChatMessage } from "@/types/chat";

const STORAGE_KEY = "mfa.chat";
const MAX_CONVERSATIONS = 10;

interface ChatStore {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  isOpen: boolean;
  sendMessage: (content: string) => Promise<void>;
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

  sendMessage: async (content: string) => {
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
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "system", content: "You are a helpful email assistant for misfits.ai Mail. Answer concisely in French or English." }, ...messages.map((m) => ({ role: m.role, content: m.content }))] }),
      });
      const data = await res.json();
      const assistantMsg: ChatMessage = { role: "assistant", content: data.content || "Sorry, I could not generate a response.", timestamp: Date.now() };
      set((s) => {
        const conversations = s.conversations.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() } : c
        );
        saveConversations(conversations);
        return { conversations, isStreaming: false };
      });
    } catch (err) {
      set({ isStreaming: false, error: "Failed to get AI response" });
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
