"use client";
import { useChatStore } from "@/stores/chat-store";

export function useChat() {
  const store = useChatStore();
  return {
    sendMessage: store.sendMessage,
    isStreaming: store.isStreaming,
    error: store.error,
    isOpen: store.isOpen,
    toggleOpen: store.toggleOpen,
    setOpen: store.setOpen,
    activeConversationId: store.activeConversationId,
  };
}

export function useConversations() {
  const conversations = useChatStore((s) => s.conversations);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  return { conversations, deleteConversation, selectConversation, createConversation };
}
