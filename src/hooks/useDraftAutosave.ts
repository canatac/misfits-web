"use client";

import { useEffect, useRef, useCallback } from "react";
import { useComposerStore } from "@/stores/composer-store";

const AUTOSAVE_INTERVAL_MS = 10_000;

export function useDraftAutosave() {
  const store = useComposerStore;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>("");

  const saveDraft = useCallback(() => {
    const state = store.getState();
    if (!state.isDirty) return;
    const snap = JSON.stringify({ to: state.to, cc: state.cc, bcc: state.bcc, subject: state.subject, body: state.body, attachments: state.attachments });
    if (snap === lastSavedRef.current) return;
    lastSavedRef.current = snap;
    if (typeof window !== "undefined") {
      localStorage.setItem("composer.draft", snap);
      localStorage.setItem("composer.draft.timestamp", new Date().toISOString());
    }
    store.setState({ lastSavedAt: new Date().toISOString() });
  }, [store]);

  const loadDraft = useCallback(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("composer.draft");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("composer.draft");
      localStorage.removeItem("composer.draft.timestamp");
    }
    lastSavedRef.current = "";
    store.setState({ lastSavedAt: null });
  }, [store]);

  const startAutosave = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(saveDraft, AUTOSAVE_INTERVAL_MS);
  }, [saveDraft]);

  const stopAutosave = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { saveDraft, loadDraft, clearDraft, startAutosave, stopAutosave };
}
