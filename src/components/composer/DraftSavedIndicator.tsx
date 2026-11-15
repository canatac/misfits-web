"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { relativeTime } from "@/stores/composer-store-helpers";

/**
 * Visual indicator of the draft autosave state (AC3).
 *
 * Renders "Draft saved" with the relative timestamp of the last save, or
 * "Saving…" while a save is in flight. Hidden when no draft has ever been
 * saved. Polls on an interval so the relative time stays fresh.
 */
export function DraftSavedIndicator() {
  const saveStatus = useComposerStore((s) => s.saveStatus);
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  if (!lastSavedAt) return null;

  const label =
    saveStatus === "saving"
      ? "Enregistrement…"
      : saveStatus === "saved"
        ? "Brouillon enregistré"
        : null;

  if (!label) return null;

  return (
    <span
      className="text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
      data-testid="draft-saved-indicator"
    >
      {label}
      {saveStatus === "saved" ? ` · ${relativeTimeAt(lastSavedAt, now)}` : ""}
    </span>
  );
}

/** Relative time that does not depend on the store's clock. */
function relativeTimeAt(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours}h`;
}
