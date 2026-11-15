import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";

/**
 * Relative, human-readable timestamp of the last draft save.
 * "à l'instant" for the first seconds, then minutes/hours/days.
 */
function formatRelative(savedAt: string, now: number): string {
  const then = new Date(savedAt).getTime();
  if (Number.isNaN(then)) return "";
  const diffSeconds = Math.max(0, Math.round((now - then) / 1000));
  if (diffSeconds < 15) return "à l'instant";
  if (diffSeconds < 60) return `il y a ${diffSeconds} s`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} j`;
}

/**
 * "Draft saved" indicator with the timestamp of the last autosave.
 * Renders nothing when no draft has been saved yet (AC3).
 */
export function DraftSavedIndicator() {
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);
  const saveStatus = useComposerStore((s) => s.saveStatus);
  const [now, setNow] = useState(() => Date.now());

  // Keep the relative timestamp fresh while the composer stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!lastSavedAt) return null;

  const label = saveStatus === "saving" ? "Enregistrement…" : "Brouillon enregistré";

  return (
    <span
      data-testid="draft-saved-indicator"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      {label} · {formatRelative(lastSavedAt, now)}
    </span>
  );
}
