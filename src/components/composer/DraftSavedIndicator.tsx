"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";

/** Relative timestamp in French, as the composer UI is French-first. */
function formatRelative(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "à l'instant";
  if (minutes === 1) return "il y a 1 minute";
  if (minutes < 60) return `il y a ${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "il y a 1 heure";
  if (hours < 24) return `il y a ${hours} heures`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "il y a 1 jour" : `il y a ${days} jours`;
}

/**
 * "Draft saved" indicator with a relative timestamp (AC3).
 *
 * Renders nothing while no draft has been saved. The text is announced to
 * screen readers through a polite live region, so a save never interrupts
 * typing but remains perceivable.
 */
export function DraftSavedIndicator() {
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const saveStatus = useComposerStore((s) => s.saveStatus);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!lastSavedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  if (!lastSavedAt) return null;

  return (
    <p
      data-testid="draft-saved-indicator"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      {saveStatus === "saving" ? "Enregistrement…" : "Brouillon enregistré"}
      {saveStatus === "saved" ? ` · ${formatRelative(lastSavedAt, now)}` : ""}
    </p>
  );
}
