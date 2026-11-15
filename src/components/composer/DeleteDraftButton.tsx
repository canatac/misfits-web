"use client";

import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

const CONFIRM_RESET_MS = 5_000;

/**
 * "Supprimer le brouillon" button (AC4).
 *
 * Two-step destructive action: the first click arms a confirmation state, the
 * second deletes the persisted draft and resets the store. The confirmation
 * disarms itself after a few seconds so it cannot be left open by accident.
 */
export function DeleteDraftButton() {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), CONFIRM_RESET_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

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
      aria-pressed={confirming}
      className="text-xs text-destructive underline-offset-2 hover:underline"
    >
      {confirming ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
