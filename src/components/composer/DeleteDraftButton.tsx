"use client";

import { useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/**
 * Deletes the current draft (AC4). The first click arms the confirmation,
 * the second click clears the persisted draft and resets the store.
 */
export function DeleteDraftButton() {
  const [confirming, setConfirming] = useState(false);

  const onDelete = () => {
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
      onClick={onDelete}
      aria-pressed={confirming}
      className={
        confirming
          ? "text-sm text-destructive"
          : "text-sm text-muted-foreground hover:text-destructive"
      }
    >
      {confirming ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
