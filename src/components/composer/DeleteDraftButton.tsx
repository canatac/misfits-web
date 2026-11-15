"use client";

import { useEffect, useRef, useState } from "react";
import { useDraftAutosave } from "@/hooks/useDraftAutosave";

const CONFIRM_TIMEOUT_MS = 5_000;

/**
 * Delete-draft button with a two-step confirmation.
 *
 * First click arms the confirmation ("Confirmer la suppression"); a second
 * click within 5s clears the persisted draft and resets the store. The
 * confirmation disarms itself after the timeout so a stray click cannot
 * delete the draft.
 */
export function DeleteDraftButton() {
  const { clearDraft } = useDraftAutosave();
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setConfirming(false);
    clearDraft();
  };

  return (
    <button
      type="button"
      data-testid="delete-draft-button"
      onClick={handleClick}
      aria-pressed={confirming}
      className={
        confirming
          ? "rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          : "rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      }
    >
      {confirming ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
