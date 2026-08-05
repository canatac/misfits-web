"use client";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useAuthStore } from "@/stores/auth-store";
import { ChatMessageBubble } from "@/components/mail/chat-message";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, X } from "lucide-react";

const QUICK_PROMPTS = [
  "Quels emails importants aujourd'hui?",
  "Résume ce thread",
  "Trouve les emails sur le budget Q4",
];

export function ChatPanel() {
  const {
    isOpen,
    setOpen,
    conversations,
    activeConversationId,
    sendMessage,
    isStreaming,
    createConversation,
    traceEnabled,
    traceEvents,
    setTraceEnabled,
    clearTrace,
  } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeConversationId);

  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages.length, isStreaming, traceEvents.length]);

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
    <div className="fixed right-0 top-0 z-50 flex h-screen w-[28rem] max-w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
          <span className="text-sm font-semibold">Mail Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !traceEnabled;
              setTraceEnabled(next);
              if (!next) clearTrace();
            }}
            className={`rounded border px-2 py-1 text-xs ${
              traceEnabled
                ? "border-[var(--color-brand-500)] text-[var(--color-brand-500)]"
                : "border-[var(--color-border)] text-[var(--color-muted-fg)]"
            }`}
            title="Afficher les détails d'exécution (mode CLI-like)"
          >
            Trace {traceEnabled ? "on" : "off"}
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
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

        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
            <Sparkles className="h-4 w-4 animate-pulse" />
            {traceEnabled ? "Exécution Hermes en cours..." : "Thinking..."}
          </div>
        )}

        {traceEnabled && traceEvents.length > 0 && (
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--color-muted-fg)]">Détails exécution</p>
              <button
                className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                onClick={clearTrace}
              >
                clear
              </button>
            </div>
            <div className="space-y-1">
              {traceEvents.slice(-14).map((e) => (
                <div key={e.id} className="text-xs">
                  <span
                    className={
                      e.level === "error"
                        ? "text-red-500"
                        : e.level === "warn"
                          ? "text-amber-500"
                          : "text-[var(--color-muted-fg)]"
                    }
                  >
                    [{new Date(e.at).toLocaleTimeString()}] {e.kind}
                  </span>
                  <span className="ml-2 text-[var(--color-fg)]">{e.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
