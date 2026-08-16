/**
 * Persistence helpers for the composer store: draft snapshotting,
 * localStorage read/write, and id/timestamp utilities.
 */
import type {
  Attachment,
  EmailSignature,
  Recipient,
} from "@/types/composer";
import type { ComposerStore } from "../../composer-store";

export const STORAGE_KEY = "misfits:composer-draft";
export const AUTOSAVE_INTERVAL = 10_000;

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

export function snapshot(state: ComposerStore): DraftSnapshot {
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

export function persistDraft(state: ComposerStore): void {
  if (typeof window === "undefined") return;
  try {
    const snap = snapshot(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    state.draftId = snap.id;
    state.lastSavedAt = snap.updatedAt;
    state.isDirty = false;
  } catch {
    // localStorage may be full or unavailable; ignore.
  }
}

export function clearPersistedDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readPersistedDraft(): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftSnapshot;
  } catch {
    return null;
  }
}

/** Build the outbound payload sent to the composer repository. */
export function buildOutboundPayload(snap: DraftSnapshot) {
  return {
    to: snap.to.map((r) => ({ email: r.email, name: r.name })),
    cc: snap.cc.map((r) => ({ email: r.email, name: r.name })),
    bcc: snap.bcc.map((r) => ({ email: r.email, name: r.name })),
    subject: snap.subject,
    body: snap.body,
  };
}
