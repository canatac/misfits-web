"use client";

import { useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/**
 * Delete-draft button of the composer (AC4).
 *
 * Two-step action: the first click arms the confirmation, the second click
 * stops the autosave, clears the persisted snapshot and resets the store.
 */
export function DeleteDraftButton() {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const s = useComposerStore.getState();
    s.stopAutosave();
    s.reset();
    clearPersistedSnapshot();
    setConfirming(false);
  };

  return (
    <button
      type="button"
      data-testid="delete-draft-button"
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      className={
        confirming
          ? "text-sm text-destructive"
          : "text-sm text-muted-foreground hover:text-foreground"
      }
    >
      {confirming ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
