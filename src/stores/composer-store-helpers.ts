/**
 * Helpers for the composer store: initial state, draft snapshot persistence
 * (localStorage) and small utilities.
 */
import type {
  Attachment, ComposeDraft, EmailSignature, Recipient, RecipientType,
} from "@/types/composer";

/** localStorage key of the persisted draft snapshot. */
export const STORAGE_KEY = "misfits.composer.draft.v1";

/** Autosave interval (ms) — the draft is persisted every 10s while dirty. */
export const AUTOSAVE_INTERVAL = 10_000;

/** Save status shown by the composer indicator. */
export type SaveStatus = "idle" | "saving" | "saved";

/** Persisted draft snapshot (serialisable). */
export interface DraftSnapshot {
  id: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  body: string;
  attachments: Attachment[];
  signature: EmailSignature | null;
  inReplyTo?: string;
  references?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Prefill applied when the composer opens (reply/forward/template). */
export interface ComposerPrefill {
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  subject?: string;
  body?: string;
  inReplyTo?: string;
  references?: string[];
}

/** Initial composer state (recipients empty, no signature). */
export const initialComposerState = {
  to: [] as Recipient[],
  cc: [] as Recipient[],
  bcc: [] as Recipient[],
  subject: "",
  body: "",
  attachments: [] as Attachment[],
  signature: null as EmailSignature | null,
  isFullScreen: false,
  isCompact: false,
  lastSavedAt: null as string | null,
  isDirty: false,
  sending: false,
  sendError: null as string | null,
  saveStatus: "idle" as SaveStatus,
  composerOpen: false,
};

/** Short unique id (no dependency). */
export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

/** Current time as an ISO string. */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Build the persisted snapshot of a composer state. */
export function persistSnapshot(state: {
  draftId: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  body: string;
  attachments: Attachment[];
  signature: EmailSignature | null;
  inReplyTo?: string;
  references?: string[];
}): DraftSnapshot {
  const now = nowISO();
  return {
    id: state.draftId,
    to: state.to,
    cc: state.cc,
    bcc: state.bcc,
    subject: state.subject,
    body: state.body,
    attachments: state.attachments,
    signature: state.signature,
    inReplyTo: state.inReplyTo,
    references: state.references,
    createdAt: now,
    updatedAt: now,
  };
}

/** Read the persisted snapshot from localStorage; null when absent/invalid. */
export function readPersistedSnapshot(): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftSnapshot;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Remove the persisted snapshot from localStorage. */
export function clearPersistedSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode): nothing to clear */
  }
}
