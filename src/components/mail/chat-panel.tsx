"use client";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useAuthStore } from "@/stores/auth-store";
import { ChatMessageBubble } from "@/components/mail/chat-message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Quels emails importants aujourd'hui?",
  "Résume ce thread",
  "Trouve les emails sur le budget Q4",
];

export function ChatPanel() {
  const { isOpen, setOpen, conversations, activeConversationId, sendMessage, isStreaming, createConversation, selectConversation } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeConversationId);

  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages.length, isStreaming]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim(), {
      currentEmailId: selectedEmailId ?? undefined,
      currentFolder,
      threadId: selectedThreadId ?? selectedEmailId ?? undefined,
      userId: userId ? String(userId) : undefined,
    });
    setInput("");
  };

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-96 max-w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
          <span className="text-sm font-semibold">Mail Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {(!active || active.messages.length === 0) && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Sparkles className="h-10 w-10 text-[var(--color-brand-500)]" />
            <p className="text-sm text-[var(--color-muted-fg)]">Ask me anything about your emails.</p>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (!active) createConversation();
                  sendMessage(p, {
                    currentEmailId: selectedEmailId ?? undefined,
                    currentFolder,
                    threadId: selectedThreadId ?? selectedEmailId ?? undefined,
                    userId: userId ? String(userId) : undefined,
                  });
                }}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-muted)]"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {active?.messages.map((msg, i) => <ChatMessageBubble key={i} message={msg} />)}
        {isStreaming && <div className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]"><Sparkles className="h-4 w-4 animate-pulse" /> Thinking...</div>}
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your emails..."
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          />
          <Button size="icon" onClick={handleSend} disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
