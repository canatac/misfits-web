"use client";
import { Sparkles } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";

export function ChatTrigger() {
  const isOpen = useChatStore((s) => s.isOpen);
  const toggleOpen = useChatStore((s) => s.toggleOpen);
  if (isOpen) return null;
  return (
    <button
      onClick={toggleOpen}
      className="fixed right-6 bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-white shadow-lg transition hover:bg-[var(--color-brand-600)]"
      aria-label="Open AI assistant"
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );
}
