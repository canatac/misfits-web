"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";

/** Format a saved-at ISO timestamp as a short relative label in French. */
function relativeLabel(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

/**
 * Shows "Brouillon enregistré" with the time of the last save.
 * Renders nothing when no draft has been saved yet.
 */
export function DraftSavedIndicator() {
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!lastSavedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  if (!lastSavedAt) return null;

  return (
    <span
      data-testid="draft-saved-indicator"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      Brouillon enregistré {relativeLabel(lastSavedAt, now)}
    </span>
  );
}
