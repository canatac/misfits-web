"use client";

import { useDraftAutosave } from "@/hooks/useDraftAutosave";

/**
 * Delete-draft button for the composer (AC4 of misfits-web#1036).
 *
 * Clears the persisted draft and resets the composer to its initial state.
 * Asks for confirmation so a misclick cannot discard a draft silently.
 */
export function DeleteDraftButton() {
  const { clearDraft } = useDraftAutosave();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm("Supprimer le brouillon ?")) {
          clearDraft();
        }
      }}
      className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      Supprimer le brouillon
    </button>
  );
}
