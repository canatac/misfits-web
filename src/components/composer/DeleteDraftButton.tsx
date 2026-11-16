"use client";

import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/**
 * Deletes the current draft. The click asks for confirmation through
 * window.confirm; on confirm it clears the persisted draft and resets the
 * composer store.
 */
export function DeleteDraftButton() {
  const handleClick = () => {
    const s = useComposerStore.getState();
    if (s.subject || s.body || s.to.length > 0 || s.cc.length > 0 || s.bcc.length > 0 || s.attachments.length > 0) {
      if (!window.confirm("Supprimer le brouillon ?")) return;
    }
    s.stopAutosave();
    s.reset();
    clearPersistedSnapshot();
  };

  return (
    <button
      type="button"
      data-testid="delete-draft-button"
      onClick={handleClick}
      className="text-xs text-gray-500 hover:text-gray-700"
    >
      Supprimer le brouillon
    </button>
  );
}
