/**
 * AI composer hooks (TanStack Query).
 *
 * - useGenerateEmail   → streaming mutation (onChunk receives deltas)
 * - useRewriteText     → mutation
 * - useTranslateText   → mutation
 * - useGenerateSubject → mutation returning subject suggestions
 * - useSmartComplete   → debounced (500ms) query for inline ghost text
 *
 * The mutations delegate to the AI store so generation state and history stay
 * consistent across the app. `useSmartComplete` calls the lightweight
 * `smartComplete` client helper directly (no history pollution) with a
 * debounce + abort-on-new-input.
 */
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAIStore } from "@/stores/ai-store";
import { smartComplete } from "@/lib/ai-client";
import type {
  AIComposerRequest,
  AILength,
  AITone,
  AITranslationLang,
} from "@/types/ai";

/** Streaming email generation. Pass an `onChunk` callback to render deltas. */
export function useGenerateEmail() {
  const generateEmail = useAIStore((s) => s.generateEmail);
  return useMutation({
    mutationFn: (vars: {
      req: AIComposerRequest;
      onChunk?: (chunk: string, full: string) => void;
    }) => generateEmail(vars.req, vars.onChunk),
  });
}

/** Rewrite selected text in a different tone / length. */
export function useRewriteText() {
  const rewriteText = useAIStore((s) => s.rewriteText);
  return useMutation({
    mutationFn: (vars: { text: string; tone?: AITone; length?: AILength }) =>
      rewriteText(vars.text, { tone: vars.tone, length: vars.length }),
  });
}

/** Translate selected text into a target language. */
export function useTranslateText() {
  const translateText = useAIStore((s) => s.translateText);
  return useMutation({
    mutationFn: (vars: { text: string; target: AITranslationLang }) =>
      translateText(vars.text, vars.target),
  });
}

/** Generate subject-line suggestions from the email body. */
export function useGenerateSubject() {
  const generateSubject = useAIStore((s) => s.generateSubject);
  return useMutation({
    mutationFn: (body: string) => generateSubject(body),
  });
}

const SMART_COMPLETE_DEBOUNCE_MS = 500;
const SMART_COMPLETE_MIN_CHARS = 3;

/**
 * Debounced inline autocomplete. Call `fetch(textBefore)` on each editor
 * update; after the user pauses for 500ms it requests a short continuation.
 * `suggestion` holds the latest ghost text (empty when idle). `clear` hides it.
 */
export function useSmartComplete() {
  const [suggestion, setSuggestion] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setSuggestion("");
    setIsFetching(false);
  }, []);

  const fetch = useCallback((textBefore: string) => {
    // Reset any in-flight request.
    if (timer.current) clearTimeout(timer.current);
    abortRef.current?.abort();

    const trimmed = textBefore.trim();
    if (trimmed.length < SMART_COMPLETE_MIN_CHARS) {
      setSuggestion("");
      return;
    }

    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsFetching(true);
      try {
        const res = await smartComplete({
          textBefore,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          const text = res.content.trim();
          // Avoid echoing the text the user already typed.
          setSuggestion(text && text !== trimmed ? text : "");
        }
      } catch {
        if (!controller.signal.aborted) setSuggestion("");
      } finally {
        if (!controller.signal.aborted) setIsFetching(false);
      }
    }, SMART_COMPLETE_DEBOUNCE_MS);
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      abortRef.current?.abort();
    };
  }, []);

  return { suggestion, isFetching, fetch, clear };
}
