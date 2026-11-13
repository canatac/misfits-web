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
  const store = useComposerStore;

  const saveDraft = useCallback(() => {
    store.getState().saveDraft();
  }, [store]);

  const loadDraft = useCallback(() => {
    return store.getState().loadPersistedDraft();
  }, [store]);

  const clearDraft = useCallback(() => {
    const s = store.getState();
    s.stopAutosave();
    s.reset();
    clearPersistedSnapshot();
  }, [store]);

  const startAutosave = useCallback(() => {
    store.getState().startAutosave();
  }, [store]);

  const stopAutosave = useCallback(() => {
    store.getState().stopAutosave();
  }, [store]);

  const scheduleDebouncedSave = useCallback(() => {
    store.getState().saveDraft();
  }, [store]);

  return { saveDraft, loadDraft, clearDraft, startAutosave, stopAutosave, scheduleDebouncedSave };
}
