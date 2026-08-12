"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChatMessage, ChatSourceCitation } from "@/types/chat";

interface ChatTrustBlockProps {
  message: ChatMessage | null;
  onSourceClick?: (source: ChatSourceCitation) => void;
}

function humanizeSource(source: ChatSourceCitation): string {
  if (source.kind === "email") return "Email lié";
  if (source.kind === "thread") return "Thread lié";
  if (source.kind === "folder") return `Dossier: ${source.value}`;
  if (source.kind === "attachment") return `Pièce jointe: ${source.value}`;
  return `${source.label}: ${source.value}`;
}

export function ChatTrustBlock({
  message,
  onSourceClick,
}: ChatTrustBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const confidence =
    typeof message?.metadata?.confidence === "string"
      ? message.metadata.confidence
      : null;
  const confidenceReason =
    typeof message?.metadata?.confidenceReason === "string"
      ? message.metadata.confidenceReason
      : "Aucun détail de fiabilité disponible.";
  const sources = useMemo(
    () =>
      Array.isArray(message?.metadata?.sources)
        ? message?.metadata?.sources
        : [],
    [message?.metadata?.sources]
  );

  if (!message || !confidence) return null;

  const confidenceVariant =
    confidence === "high"
      ? "success"
      : confidence === "medium"
        ? "warning"
        : "destructive";
  const confidenceLabel =
    confidence === "high"
      ? "Confiance élevée"
      : confidence === "medium"
        ? "Confiance modérée"
        : "À vérifier";

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-2">
      <div className="flex items-center gap-2">
        <Badge variant={confidenceVariant}>{confidenceLabel}</Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[11px]"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Masquer" : "Pourquoi ?"}
        </Button>
      </div>

      {expanded && (
        <p className="mt-2 text-xs text-[var(--color-muted-fg)]">
          {confidenceReason}
        </p>
      )}

      {sources.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {sources.slice(0, 4).map((source) => (
            <button
              key={`${source.kind ?? source.label}-${source.value}`}
              onClick={() => onSourceClick?.(source)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-muted-fg)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-500)]"
            >
              {humanizeSource(source)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
