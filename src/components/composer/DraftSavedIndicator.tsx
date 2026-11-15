"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { relativeTime } from "@/stores/composer-store-helpers";

/**
 * "Draft saved" indicator with a relative timestamp.
 *
 * Renders nothing until a draft has been saved (lastSavedAt set). The
 * timestamp refreshes every 30s so it stays meaningful while the composer is
 * open. Announced politely to screen readers.
 */
export function DraftSavedIndicator() {
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const saveStatus = useComposerStore((s) => s.saveStatus);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  if (!lastSavedAt) return null;

  const label = saveStatus === "saving" ? "Enregistrement…" : "Brouillon enregistré";

  return (
    <span
      data-testid="draft-saved-indicator"
      aria-live="polite"
      className="text-xs text-gray-500"
    >
      {label} <span className="text-gray-400">· {relativeTime(lastSavedAt)}</span>
    </span>
  );
}
