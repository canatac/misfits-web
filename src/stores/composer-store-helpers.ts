/**
 * Pure helpers and shared types for the composer store.
 *
 * Kept free of any imports from `composer-store.ts` to avoid cycles.
 */
import type {
  Attachment,
  EmailSignature,
  Recipient,
} from "@/types/composer";

export const STORAGE_KEY = "misfits:composer-draft";
export const AUTOSAVE_INTERVAL = 10_000;

export type SaveStatus = "idle" | "saving" | "saved";

export function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

/** Serialisable snapshot persisted to localStorage. */
export interface DraftSnapshot {
  id: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  body: string;
  attachments: Attachment[];
  signature: EmailSignature | null;
  updatedAt: string;
  inReplyTo?: string;
  references?: string[];
}

/** Minimal state shape needed to build a snapshot. */
export interface SnapshotSource {
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
}

export function snapshot(state: SnapshotSource): DraftSnapshot {
  return {
    id: state.draftId,
    to: state.to,
    cc: state.cc,
    bcc: state.bcc,
    subject: state.subject,
    body: state.body,
    attachments: state.attachments,
    signature: state.signature,
    updatedAt: nowISO(),
    inReplyTo: state.inReplyTo,
    references: state.references,
  };
}

/** Persist a draft snapshot to localStorage; returns the snapshot on success. */
export function persistSnapshot(state: SnapshotSource): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const snap = snapshot(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    return snap;
  } catch {
    return null;
  }
}

/** Read a persisted draft snapshot from localStorage. */
export function readPersistedSnapshot(): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftSnapshot;
  } catch {
    return null;
  }
}

export function clearPersistedSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Check whether a persisted draft exists in localStorage. */
export function hasPersistedDraft(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Human-readable relative time from an ISO timestamp (e.g. "il y a 5s"). */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours}h`;
}

/** Initial state shared by reset/open/create. Callers must set a fresh draftId. */
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
  draftId: "",
  lastSavedAt: null as string | null,
  isDirty: false,
  inReplyTo: undefined as string | undefined,
  references: undefined as string[] | undefined,
  sending: false,
  sendError: null as string | null,
  saveStatus: "idle" as SaveStatus,
  _autosaveTimer: null as ReturnType<typeof setInterval> | null,
  composerOpen: false,
};

/** Pre-fill payload used to open the composer for a reply/forward/template. */
export interface ComposerPrefill {
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  subject?: string;
  body?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: Attachment[];
}
