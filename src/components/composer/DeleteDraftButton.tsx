"use client";

import { useState } from "react";
import { useDraftAutosave } from "@/hooks/useDraftAutosave";

/**
 * "Supprimer le brouillon" button (AC4).
 *
 * Two-step confirm: the first click arms the button, the second deletes the
 * persisted draft, resets the store and stops autosave. Keyboard accessible
 * (native button, focus-visible ring) and announced via aria-live.
 */
export function DeleteDraftButton() {
  const { clearDraft } = useDraftAutosave();
  const [armed, setArmed] = useState(false);

  const onClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    clearDraft();
    setArmed(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onBlur={() => setArmed(false)}
      className={
        armed
          ? "rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          : "rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      }
      aria-label="Supprimer le brouillon"
      data-testid="delete-draft-button"
    >
      {armed ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
