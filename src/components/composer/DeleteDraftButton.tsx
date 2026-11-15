"use client";

import { useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/**
 * Deletes the current draft. The first click asks for confirmation, the
 * second one clears the persisted draft and resets the composer store.
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
          ? "text-xs text-red-600 hover:text-red-700"
          : "text-xs text-gray-500 hover:text-gray-700"
      }
    >
      {confirming ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
