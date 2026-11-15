/**
 * Helpers for the composer draft persistence (localStorage).
 *
 * The snapshot shape is the serialisable part of the composer store:
 * recipients, subject, body, attachments, signature and thread metadata.
 */
import type {
  Attachment, ComposeDraft, EmailSignature, Recipient,
} from "@/types/composer";

/** localStorage key holding the persisted draft. */
export const STORAGE_KEY = "misfits.composer.draft";

/** Autosave interval (ms). */
export const AUTOSAVE_INTERVAL = 10_000;

export type SaveStatus = "idle" | "saving" | "saved";

/** Prefill data used when the composer is opened from a reply/forward/template. */
export interface ComposerPrefill {
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  subject?: string;
  body?: string;
  inReplyTo?: string;
  references?: string[];
}

/** Persisted draft snapshot. */
export interface DraftSnapshot {
  id: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  body: string;
  attachments: Attachment[];
  signature: EmailSignature | null;
  createdAt: string;
  updatedAt: string;
  inReplyTo?: string;
  references?: string[];
}

/** Base (non-draft) composer state. */
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
  _autosaveTimer: null as ReturnType<typeof setInterval> | null,
  composerOpen: false,
};

/** Monotonic-ish unique id (no dependency). */
export function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

/** Current time as an ISO string. */
export function nowISO(): string {
  return new Date().toISOString();
}

/** True when the snapshot has no content worth persisting. */
export function isEmptySnapshot(snap: DraftSnapshot): boolean {
  return (
    snap.to.length === 0 &&
    snap.cc.length === 0 &&
    snap.bcc.length === 0 &&
    snap.subject.trim() === "" &&
    snap.body.trim() === "" &&
    snap.attachments.length === 0
  );
}

/**
 * Build a snapshot from the current store state, or null when there is
 * nothing to persist (empty draft).
 */
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
  lastSavedAt: string | null;
}): DraftSnapshot | null {
  const now = nowISO();
  const snap: DraftSnapshot = {
    id: state.draftId,
    to: state.to,
    cc: state.cc,
    bcc: state.bcc,
    subject: state.subject,
    body: state.body,
    // Never persist the underlying File object: it is not serialisable.
    attachments: state.attachments.map(({ file: _file, ...rest }) => rest),
    signature: state.signature,
    createdAt: now,
    updatedAt: now,
    inReplyTo: state.inReplyTo,
    references: state.references,
  };
  if (isEmptySnapshot(snap)) return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // Storage full or unavailable: the draft stays in memory only.
    return null;
  }
  return snap;
}

/** Read the persisted snapshot, or null when absent/corrupt. */
export function readPersistedSnapshot(): DraftSnapshot | null {
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

/** Remove the persisted snapshot. */
export function clearPersistedSnapshot(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore: nothing to clear
  }
}

/** Human-readable relative time for the "Draft saved" indicator. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (diff < 60) return "à l'instant";
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}
