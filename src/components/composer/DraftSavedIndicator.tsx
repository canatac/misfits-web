"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { relativeTime } from "@/stores/composer-store-helpers";

/**
 * Draft save indicator for the composer (AC3 of misfits-web#1036).
 *
 * Shows "Draft saved" with a relative timestamp whenever the store has
 * persisted a draft, and "Saving…" while an autosave is in flight. The
 * timestamp is re-evaluated every 15s so it stays readable without user
 * action. Rendered as a status region so screen readers announce changes.
 */
export function DraftSavedIndicator() {
  const saveStatus = useComposerStore((s) => s.saveStatus);
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  if (!lastSavedAt && saveStatus !== "saving") return null;

  const label =
    saveStatus === "saving"
      ? "Enregistrement…"
      : `Brouillon enregistré ${relativeTime(lastSavedAt ?? new Date(now).toISOString())}`;

  return (
    <span
      role="status"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      {label}
    </span>
  );
}
