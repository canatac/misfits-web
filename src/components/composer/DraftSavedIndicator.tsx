"use client";

import { useComposerStore } from "@/stores/composer-store";
import { relativeTime } from "@/stores/composer-store-helpers";

/**
 * Shows "Brouillon enregistré" with a relative timestamp once a draft has
 * been saved (AC3). Renders nothing while no draft was ever saved.
 *
 * The text is announced politely to screen readers: saving is a background
 * event, not an interruption.
 */
export function DraftSavedIndicator() {
  const lastSavedAt = useComposerStore((s) => s.lastSavedAt);

  if (!lastSavedAt) return null;

  return (
    <p
      data-testid="draft-saved-indicator"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      Brouillon enregistré · {relativeTime(lastSavedAt)}
    </p>
  );
}
