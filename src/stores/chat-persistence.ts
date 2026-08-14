"use client";
// chat-persistence.ts — extracted Sprint 3-3
import type { ChatConversation } from "@/types/chat";

export const STORAGE_KEY = "mfa.chat";
export const MAX_CONVERSATIONS = 10;

export function loadConversations(): ChatConversation[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: ChatConversation[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS))
    );
  } catch {
    // no-op
  }
}

