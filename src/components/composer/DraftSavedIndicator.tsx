"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";

/**
 * Visual indicator of the draft save state (AC3).
 *
 * Renders nothing when no draft was ever saved. Once a draft is saved, it
 * shows "Brouillon enregistré" followed by a relative timestamp, and announces
 * the change to screen readers through a polite live region.
 */
export function DraftSavedIndicator() {
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const saveStatus = useComposerStore((s) => s.saveStatus);
  const [now, setNow] = useState(() => Date.now());

  // Keep the relative timestamp fresh while the composer stays open.
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  if (!lastSavedAt) return null;

  const label =
    saveStatus === "saving"
      ? "Enregistrement…"
      : `Brouillon enregistré ${relativeTime(lastSavedAt, now)}`;

  return (
    <span
      data-testid="draft-saved-indicator"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      {label}
    </span>
  );
}

/** Human-readable relative time in French (e.g. "à l'instant", "il y a 2 min"). */
function relativeTime(iso: string, nowMs: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "à l'instant";
  const seconds = Math.max(0, Math.round((nowMs - then) / 1000));
  if (seconds < 45) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}
