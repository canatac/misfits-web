"use client";

import { cn } from "@/lib/utils";
import { User, Bot, Copy, FilePenLine, ListTodo, ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onInsertToDraft?: (content: string) => void;
  onCreateTasks?: (content: string) => void;
  onFeedback?: (vote: "up" | "down", reason?: string) => void;
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
  onFeedback,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");
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
  const latencyMs =
    typeof message.metadata?.latencyMs === "number"
      ? Math.max(0, Math.round(message.metadata.latencyMs))
      : null;
  const feedbackPlaceholder = useMemo(
    () => "Pourquoi ? (optionnel, 120 caractères max)",
    [],
  );
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

        {!isUser && (latencyMs !== null || sources.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {latencyMs !== null && (
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-muted-fg)]">
                latence {latencyMs}ms
              </span>
            )}
            {sources.length > 0 && (
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-muted-fg)]">
                {sources.length} source(s)
              </span>
            )}
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

            {onFeedback && (
              <>
                <button
                  onClick={() => {
                    onFeedback("up");
                    setFeedbackOpen(false);
                  }}
                  className="opacity-70 hover:opacity-100"
                  title="Réponse utile"
                >
                  <ThumbsUp className="mr-1 inline h-3 w-3" /> Utile
                </button>
                <button
                  onClick={() => setFeedbackOpen((v) => !v)}
                  className="opacity-70 hover:opacity-100"
                  title="Réponse non satisfaisante"
                >
                  <ThumbsDown className="mr-1 inline h-3 w-3" /> Pas utile
                </button>
              </>
            )}
          </div>
        )}

        {!isUser && feedbackOpen && onFeedback && (
          <div className="mt-2 rounded border border-[var(--color-border)]/60 bg-[var(--color-bg)]/70 p-2 text-[11px]">
            <input
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value.slice(0, 120))}
              placeholder={feedbackPlaceholder}
              className="w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-1 text-[11px]"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  onFeedback("down", feedbackReason.trim() || undefined);
                  setFeedbackOpen(false);
                  setFeedbackReason("");
                }}
                className="rounded border border-[var(--color-border)] px-2 py-1"
              >
                Envoyer
              </button>
              <button
                onClick={() => {
                  setFeedbackOpen(false);
                  setFeedbackReason("");
                }}
                className="rounded border border-[var(--color-border)] px-2 py-1"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
