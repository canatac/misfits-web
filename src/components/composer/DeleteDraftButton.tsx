import { useEffect, useState } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/**
 * Delete the current draft (AC4).
 *
 * Two-step confirm: the first click arms the button ("Confirmer la
 * suppression"), the second one clears the persisted snapshot, stops the
 * autosave timer and resets the store. The confirm state disarms after a few
 * seconds so a stray click cannot delete the draft.
 */
export function DeleteDraftButton() {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4_000);
    return () => clearTimeout(timer);
  }, [armed]);

  function handleClick() {
    if (!armed) {
      setArmed(true);
      return;
    }
    const s = useComposerStore.getState();
    s.stopAutosave();
    s.reset();
    clearPersistedSnapshot();
    setArmed(false);
  }

  return (
    <button
      type="button"
      data-testid="delete-draft-button"
      onClick={handleClick}
      className={
        armed
          ? "text-xs text-destructive hover:underline"
          : "text-xs text-muted-foreground hover:underline"
      }
    >
      {armed ? "Confirmer la suppression" : "Supprimer le brouillon"}
    </button>
  );
}
