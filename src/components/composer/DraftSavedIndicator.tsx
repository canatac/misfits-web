"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";

function relativeTime(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

/**
 * Shows "Brouillon enregistré" with the time of the last save, once a draft
 * has been saved. The element has role="status" (aria-live="polite") so a
 * screen reader announces the save state when it changes.
 */
export function DraftSavedIndicator() {
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const saveStatus = useComposerStore((s) => s.saveStatus);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lastSavedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  if (!lastSavedAt) return null;

  return (
    <span
      role="status"
      data-testid="draft-saved-indicator"
      aria-live="polite"
      className="text-xs text-gray-500"
    >
      {saveStatus === "saving" ? "Enregistrement…" : "Brouillon enregistré"}
      {saveStatus !== "saving" ? ` · ${relativeTime(lastSavedAt, now)}` : ""}
    </span>
  );
}
