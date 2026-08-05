"use client";

import { cn } from "@/lib/utils";
import { User, Bot, Copy, FilePenLine, ListTodo } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onInsertToDraft?: (content: string) => void;
  onCreateTasks?: (content: string) => void;
}

const confidenceLabel: Record<string, string> = {
  high: "Confiance élevée",
  medium: "Confiance moyenne",
  low: "Confiance faible",
};

export function ChatMessageBubble({
  message,
  onInsertToDraft,
  onCreateTasks,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const confidence =
    typeof message.metadata?.confidence === "string"
      ? message.metadata.confidence
      : null;
  const confidenceReason =
    typeof message.metadata?.confidenceReason === "string"
      ? message.metadata.confidenceReason
      : null;

  const sources = Array.isArray(message.metadata?.sources)
    ? message.metadata.sources
    : [];

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-[var(--color-brand-500)]" : "bg-[var(--color-muted)]",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-white" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-[var(--color-fg)]" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-[var(--color-brand-500)] text-white"
            : "bg-[var(--color-muted)] text-[var(--color-fg)]",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {!isUser && confidence && (
          <div className="mt-2 rounded border border-[var(--color-border)]/60 bg-[var(--color-bg)]/70 px-2 py-1 text-[11px]">
            <p className="font-medium">{confidenceLabel[confidence] ?? "Confiance"}</p>
            {confidenceReason && (
              <p className="mt-0.5 text-[var(--color-muted-fg)]">{confidenceReason}</p>
            )}
          </div>
        )}

        {!isUser && sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {sources.slice(0, 3).map((source) => {
              const label =
                source && typeof source === "object" && "label" in source
                  ? String(source.label)
                  : "Source";
              const value =
                source && typeof source === "object" && "value" in source
                  ? String(source.value)
                  : "-";
              return (
                <span
                  key={`${label}-${value}`}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-muted-fg)]"
                >
                  {label}: {value}
                </span>
              );
            })}
          </div>
        )}

        {!isUser && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <button onClick={copy} className="opacity-70 hover:opacity-100">
              {copied ? (
                "Copié"
              ) : (
                <>
                  <Copy className="mr-1 inline h-3 w-3" /> Copier
                </>
              )}
            </button>

            {onInsertToDraft && (
              <button
                onClick={() => onInsertToDraft(message.content)}
                className="opacity-70 hover:opacity-100"
              >
                <FilePenLine className="mr-1 inline h-3 w-3" /> Insérer brouillon
              </button>
            )}

            {onCreateTasks && (
              <button
                onClick={() => onCreateTasks(message.content)}
                className="opacity-70 hover:opacity-100"
              >
                <ListTodo className="mr-1 inline h-3 w-3" /> Créer tâches
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
