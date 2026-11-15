"use client";

import { useEffect, useRef, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/** Auto-cancel delay of the delete confirmation (ms). */
const CONFIRM_TIMEOUT_MS = 5_000;

/**
 * "Supprimer le brouillon" button. The first click asks for confirmation,
 * the second clears the persisted draft and resets the composer.
 */
export function DeleteDraftButton() {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
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
      aria-pressed={confirming}
      onClick={handleClick}
      className="text-xs text-destructive hover:underline"
    >
      {confirming ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
