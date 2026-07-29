"use client";
import { cn } from "@/lib/utils";
import { User, Bot, Copy } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "@/types/chat";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", isUser ? "bg-[var(--color-brand-500)]" : "bg-[var(--color-muted)]")}>
        {isUser ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-[var(--color-fg)]" />}
      </div>
      <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm", isUser ? "bg-[var(--color-brand-500)] text-white" : "bg-[var(--color-muted)] text-[var(--color-fg)]")}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && (
          <button onClick={copy} className="mt-1 text-xs opacity-50 hover:opacity-100">
            {copied ? "Copied!" : <><Copy className="inline h-3 w-3" /> Copy</>}
          </button>
        )}
      </div>
    </div>
  );
}
