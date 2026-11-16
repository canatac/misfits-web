"use client";

import { useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/**
 * Deletes the current draft. The first click asks for confirmation by
 * changing the label; the second click clears the persisted draft and resets
 * the composer store. The confirmation is visible in the UI (no native
 * window.confirm), so it is announced by screen readers and testable.
 */
export function DeleteDraftButton() {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    const s = useComposerStore.getState();
    const hasDraft =
      s.subject ||
      s.body ||
      s.to.length > 0 ||
      s.cc.length > 0 ||
      s.bcc.length > 0 ||
      s.attachments.length > 0;

    if (confirming) {
      s.stopAutosave();
      s.reset();
      clearPersistedSnapshot();
      setConfirming(false);
      return;
    }

    if (hasDraft) {
      setConfirming(true);
      return;
    }

    s.stopAutosave();
    s.reset();
    clearPersistedSnapshot();
  };

  return (
    <button
      type="button"
      data-testid="delete-draft-button"
      aria-pressed={confirming}
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      className="text-xs text-gray-500 hover:text-gray-700"
    >
      {confirming ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
