/**
 * Composer data hooks using TanStack Query.
 *
 * - useSaveDraft: debounced mutation that persists the current draft.
 * - useSendEmail: mutation supporting send-later.
 * - useUndoSend: mutation with a configurable 5–30s cancellation window.
 * - useEmailTemplates: query for built-in templates.
 * - useDrafts: query for the saved-drafts list.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";
import { emailTemplates } from "@/lib/email-templates";
import type { EmailTemplate } from "@/lib/email-templates";
import type { ComposeDraft, SendOptions } from "@/types/composer";
import { mailAuthHeaders } from "@/lib/mail-api";

/** Always hit same-origin `/api/*` (Next rewrite → email-api). Demo is login-only. */
const BACKEND_AVAILABLE = true;

const DRAFTS_KEY = "misfits:drafts";
const DEBOUNCE_MS = 1500;

/* ------------------------------------------------------------------ *
 * Drafts list (localStorage-backed)
 * ------------------------------------------------------------------ */

function readDraftsList(): ComposeDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as ComposeDraft[]) : [];
  } catch {
    return [];
  }
}

function writeDraftsList(drafts: ComposeDraft[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    // ignore
  }
}

/**
 * Query: list of saved drafts (read from localStorage).
 */
export function useDrafts() {
  return useQuery({
    queryKey: ["composer-drafts"],
    queryFn: () => readDraftsList(),
    staleTime: 10_000,
  });
}

/**
 * Mutation: save (or update) an explicit named draft into the drafts list.
 * Used by the "Save draft" button — separate from background autosave.
 */
export function useSaveDraft() {
  const queryClient = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: async (draft: ComposeDraft) => {
      if (BACKEND_AVAILABLE) {
        const res = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        if (!res.ok) throw new Error(`Save draft failed: ${res.statusText}`);
        return res.json();
      }
      // localStorage fallback
      const drafts = readDraftsList();
      const idx = drafts.findIndex((d) => d.id === draft.id);
      const updated: ComposeDraft = {
        ...draft,
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) drafts[idx] = updated;
      else drafts.unshift(updated);
      writeDraftsList(drafts);
      await new Promise((r) => setTimeout(r, 200));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["composer-drafts"] });
    },
  });

  /** Debounced save — call repeatedly; the actual mutation fires after idle. */
  const saveDebounced = useCallback(
    (draft: ComposeDraft) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        mutation.mutate(draft);
      }, DEBOUNCE_MS);
    },
    [mutation],
  );

  /** Cancel a pending debounced save. */
  const cancelPending = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => () => cancelPending(), [cancelPending]);

  return { ...mutation, saveDebounced, cancelPending };
}

/**
 * Mutation: send an email. Honours `sendLater` in SendOptions.
 */
export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      draft,
      options,
    }: {
      draft: ComposeDraft;
      options?: SendOptions;
    }) => {
      if (BACKEND_AVAILABLE) {
        const endpoint = options?.sendLater ? "/api/send/schedule" : "/api/send";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: mailAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({
            to: draft.to.map((r) => ({ email: r.email, name: r.name })),
            cc: draft.cc.map((r) => ({ email: r.email, name: r.name })),
            bcc: draft.bcc.map((r) => ({ email: r.email, name: r.name })),
            subject: draft.subject,
            body: draft.body,
            ...options,
          }),
        });
        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          throw new Error(
            errBody || `Send failed: ${res.status} ${res.statusText}`,
          );
        }

        const responseText = await res.text().catch(() => "");
        if (!responseText) {
          return {
            id: draft.id,
            messageId: res.headers.get("x-message-id") ?? draft.id,
            sent: true,
          };
        }
        try {
          return JSON.parse(responseText) as unknown;
        } catch {
          return {
            id: draft.id,
            messageId: draft.id,
            sent: true,
            raw: responseText,
          };
        }
      }
      // unreachable — BACKEND_AVAILABLE is always true; kept for tests override
      await new Promise((r) => setTimeout(r, 600));
      return { id: draft.id, sent: true, sendLater: options?.sendLater };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["composer-drafts"] });
    },
  });
}

/** Undo-send window bounds (seconds). */
export const UNDO_SEND_MIN = 5;
export const UNDO_SEND_MAX = 30;
export const UNDO_SEND_DEFAULT = 10;

/**
 * Mutation: undo a send within a configurable cancellation window.
 *
 * `windowSeconds` must be between 5 and 30. The mutation resolves after the
 * window elapses (no-op in mock mode); callers typically show a countdown
 * banner and call `undo` before the timer expires.
 */
export function useUndoSend(windowSeconds: number = UNDO_SEND_DEFAULT) {
  const clamped = Math.min(UNDO_SEND_MAX, Math.max(UNDO_SEND_MIN, windowSeconds));
  const queryClient = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendId = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      sendId.current = id;
      if (BACKEND_AVAILABLE) {
        const res = await fetch("/api/send/undo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error(`Undo failed: ${res.statusText}`);
        return res.json();
      }
      await new Promise((r) => setTimeout(r, 200));
      return { id, undone: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    },
  });

  /** Schedule the send to commit after `windowSeconds`; returns a canceller. */
  const schedule = useCallback(
    (id: string, onCommit: () => void) => {
      sendId.current = id;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        onCommit();
        timer.current = null;
      }, clamped * 1000);
      return () => {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
      };
    },
    [clamped],
  );

  /** Cancel the pending commit (i.e. actually undo). */
  const undo = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (sendId.current) {
      mutation.mutate({ id: sendId.current });
    }
  }, [mutation]);

  return { ...mutation, schedule, undo, windowSeconds: clamped };
}

/**
 * Query: built-in email templates.
 */
export function useEmailTemplates() {
  return useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      if (BACKEND_AVAILABLE) {
        const res = await fetch("/api/templates");
        if (!res.ok) throw new Error("Failed to load templates");
        return res.json();
      }
      return emailTemplates;
    },
    staleTime: Infinity,
    initialData: emailTemplates,
  });
}
