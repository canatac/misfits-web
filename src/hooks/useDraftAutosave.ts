"use client";

import { useCallback } from "react";
import { useComposerStore } from "@/stores/composer-store";
import { clearPersistedSnapshot } from "@/stores/composer-store-helpers";

/**
 * Thin facade over the composer store's draft persistence.
 *
 * The store owns the snapshot shape (recipients, subject, body, attachments,
 * signature) and the localStorage key; this hook only exposes the operations
 * the composer UI needs: save now, restore the persisted draft, delete it and
 * drive the periodic autosave timer.
 */
export function useDraftAutosave() {
  const saveDraft = useCallback(() => {
    useComposerStore.getState().saveDraft();
  }, []);

  const loadDraft = useCallback(() => {
    return useComposerStore.getState().loadPersistedDraft();
  }, []);

  const clearDraft = useCallback(() => {
    const s = useComposerStore.getState();
    s.stopAutosave();
    s.reset();
    clearPersistedSnapshot();
  }, []);

  const startAutosave = useCallback(() => {
    useComposerStore.getState().startAutosave();
  }, []);

  const stopAutosave = useCallback(() => {
    useComposerStore.getState().stopAutosave();
  }, []);

  const scheduleDebouncedSave = useCallback(() => {
    useComposerStore.getState().saveDraft();
  }, []);

  return { saveDraft, loadDraft, clearDraft, startAutosave, stopAutosave, scheduleDebouncedSave };
}
