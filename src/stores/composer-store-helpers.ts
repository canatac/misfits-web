/**
 * Helpers for the composer draft persistence (localStorage).
 *
 * The snapshot shape is shared by the store (save/restore) and the tests:
 * recipients (to/cc/bcc), subject, body (HTML), attachments, signature and
 * the reply threading fields (inReplyTo, references).
 */
import type {
  Attachment, ComposeDraft, EmailSignature, Recipient,
} from "@/types/composer";

export const STORAGE_KEY = "misfits.composer.draft.v1";

/** Debounce interval of the background autosave, in milliseconds. */
export const AUTOSAVE_INTERVAL = 10_000;

export type SaveStatus = "idle" | "saving" | "saved";

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
  updatedAt: string;
}

export interface ComposerPrefill {
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  subject?: string;
  body?: string;
  inReplyTo?: string;
  references?: string[];
}

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

export function uid(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${rand}`;
}

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
    updatedAt: nowISO(),
  };
}

/** Read the persisted snapshot, or null when none is stored or it is invalid. */
export function readPersistedSnapshot(): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DraftSnapshot;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Remove the persisted snapshot (draft deleted by the user). */
export function clearPersistedSnapshot(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Shape accepted by loadDraft, kept for compatibility with ComposeDraft. */
export type DraftInput = Partial<ComposeDraft>;
