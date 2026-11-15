"use client";

import { useEffect } from "react";
import { useDraftAutosave } from "@/hooks/useDraftAutosave";

/**
 * Restores the persisted draft when the composer opens (AC2) and keeps the
 * autosave timer running while it is open.
 *
 * Mount this once at the composer root. It does not write the store itself:
 * it delegates to loadPersistedDraft(), which is the only writer.
 */
export function DraftAutosaveProvider() {
  const { loadDraft, startAutosave, stopAutosave } = useDraftAutosave();

  useEffect(() => {
    loadDraft();
    startAutosave();
    return () => stopAutosave();
  }, [loadDraft, startAutosave, stopAutosave]);

  return null;
}
