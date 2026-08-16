/**
 * Zustand store for the email composer.
 *
 * Holds recipients (to/cc/bcc), subject, body (HTML), attachments, signature,
 * layout flags (full-screen, compact), draft metadata and send state. Drafts
 * are auto-saved to localStorage (debounced 10s) and can be loaded back.
 */
import { create } from "zustand";
import type {
  Attachment,
  ComposeDraft,
  EmailSignature,
  Recipient,
  RecipientType,
  SendOptions,
} from "@/types/composer";
import { composerRepository } from "@/lib/repositories";
import {
  AUTOSAVE_INTERVAL,
  buildOutboundPayload,
  clearPersistedDraft,
  persistDraft,
  readPersistedDraft,
  snapshot,
  uid,
} from "./parts/composer-store/persistence";

export interface ComposerStore {
  // Recipients
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  // Content
  subject: string;
  body: string;
  attachments: Attachment[];
  signature: EmailSignature | null;
  // Layout
  isFullScreen: boolean;
  isCompact: boolean;
  // Draft metadata
  draftId: string;
  lastSavedAt: string | null;
  isDirty: boolean;
  inReplyTo?: string;
  references?: string[];
  // Send state
  sending: boolean;
  sendError: string | null;
  // Autosave
  _autosaveTimer: ReturnType<typeof setInterval> | null;
  // Modal/panel open state (used by the mail page to toggle the composer)
  composerOpen: boolean;
  prefill: ComposerPrefill | null;

  // Actions
  setRecipients: (type: RecipientType, recipients: Recipient[]) => void;
  addRecipient: (type: RecipientType, recipient: Recipient) => void;
  removeRecipient: (type: RecipientType, id: string) => void;
  setSubject: (subject: string) => void;
  setBody: (body: string) => void;
  addAttachment: (attachment: Attachment) => void;
  updateAttachment: (id: string, patch: Partial<Attachment>) => void;
  removeAttachment: (id: string) => void;
  setSignature: (signature: EmailSignature | null) => void;
  toggleFullScreen: () => void;
  toggleCompact: () => void;
  saveDraft: () => void;
  send: (options?: SendOptions) => Promise<boolean>;
  scheduleSend: (date: string) => Promise<boolean>;
  reset: () => void;
  loadDraft: (draft: Partial<ComposeDraft>) => void;
  loadPersistedDraft: () => boolean;
  startAutosave: () => void;
  stopAutosave: () => void;
  openComposer: (prefill?: ComposerPrefill | null) => void;
  closeComposer: () => void;
}

/** Pre-fill payload used to open the composer for a reply/forward/template. */
export interface ComposerPrefill {
  to?: Recipient[];
  cc?: Recipient[];
  bcc?: Recipient[];
  subject?: string;
  body?: string;
  inReplyTo?: string;
  references?: string[];
}

const initialState = {
  to: [] as Recipient[],
  cc: [] as Recipient[],
  bcc: [] as Recipient[],
  subject: "",
  body: "",
  attachments: [] as Attachment[],
  signature: null as EmailSignature | null,
  isFullScreen: false,
  isCompact: false,
  draftId: uid("draft"),
  lastSavedAt: null as string | null,
  isDirty: false,
  inReplyTo: undefined as string | undefined,
  references: undefined as string[] | undefined,
  sending: false,
  sendError: null as string | null,
  _autosaveTimer: null as ReturnType<typeof setInterval> | null,
  composerOpen: false,
  prefill: null as ComposerPrefill | null,
};

export const useComposerStore = create<ComposerStore>((set, get) => ({
  ...initialState,

  setRecipients: (type, recipients) => {
    set({ [type]: recipients, isDirty: true } as Partial<ComposerStore>);
  },

  addRecipient: (type, recipient) => {
    const list = get()[type];
    if (list.some((r) => r.email === recipient.email)) return;
    set({
      [type]: [...list, recipient],
      isDirty: true,
    } as Partial<ComposerStore>);
  },

  removeRecipient: (type, id) => {
    const list = get()[type];
    set({
      [type]: list.filter((r) => r.id !== id),
      isDirty: true,
    } as Partial<ComposerStore>);
  },

  setSubject: (subject) => set({ subject, isDirty: true }),
  setBody: (body) => set({ body, isDirty: true }),

  addAttachment: (attachment) =>
    set((s) => ({
      attachments: [...s.attachments, attachment],
      isDirty: true,
    })),

  updateAttachment: (id, patch) =>
    set((s) => ({
      attachments: s.attachments.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
      isDirty: true,
    })),

  removeAttachment: (id) =>
    set((s) => {
      const att = s.attachments.find((a) => a.id === id);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return {
        attachments: s.attachments.filter((a) => a.id !== id),
        isDirty: true,
      };
    }),

  setSignature: (signature) => set({ signature, isDirty: true }),

  toggleFullScreen: () => set((s) => ({ isFullScreen: !s.isFullScreen })),
  toggleCompact: () => set((s) => ({ isCompact: !s.isCompact })),

  saveDraft: () => {
    persistDraft(get());
  },

  send: async (options) => {
    set({ sending: true, sendError: null });
    try {
      const snap = snapshot(get());
      await composerRepository.send(buildOutboundPayload(snap), options);
      clearPersistedDraft();
      set({ sending: false, sendError: null });
      return true;
    } catch (err) {
      set({ sending: false, sendError: (err as Error).message });
      return false;
    }
  },

  scheduleSend: async (date) => {
    set({ sending: true, sendError: null });
    try {
      const snap = snapshot(get());
      await composerRepository.schedule(buildOutboundPayload(snap), date);
      set({ sending: false, sendError: null });
      return true;
    } catch (err) {
      set({ sending: false, sendError: (err as Error).message });
      return false;
    }
  },

  reset: () => {
    const { _autosaveTimer } = get();
    if (_autosaveTimer) clearInterval(_autosaveTimer);
    set({
      ...initialState,
      draftId: uid("draft"),
      _autosaveTimer: null,
    });
  },

  loadDraft: (draft) => {
    set({
      to: draft.to ?? get().to,
      cc: draft.cc ?? get().cc,
      bcc: draft.bcc ?? get().bcc,
      subject: draft.subject ?? get().subject,
      body: draft.body ?? get().body,
      attachments: draft.attachments ?? get().attachments,
      signature: draft.signature ?? get().signature,
      inReplyTo: draft.inReplyTo,
      references: draft.references,
      isDirty: true,
    });
  },

  loadPersistedDraft: () => {
    const snap = readPersistedDraft();
    if (!snap) return false;
    set({
      draftId: snap.id,
      to: snap.to ?? [],
      cc: snap.cc ?? [],
      bcc: snap.bcc ?? [],
      subject: snap.subject ?? "",
      body: snap.body ?? "",
      attachments: snap.attachments ?? [],
      signature: snap.signature ?? null,
      inReplyTo: snap.inReplyTo,
      references: snap.references,
      lastSavedAt: snap.updatedAt,
      isDirty: false,
    });
    return true;
  },

  startAutosave: () => {
    const state = get();
    if (state._autosaveTimer) return;
    const timer = setInterval(() => {
      if (get().isDirty) {
        persistDraft(get());
      }
    }, AUTOSAVE_INTERVAL);
    set({ _autosaveTimer: timer });
  },

  stopAutosave: () => {
    const timer = get()._autosaveTimer;
    if (timer) {
      clearInterval(timer);
      set({ _autosaveTimer: null });
    }
  },

  openComposer: (prefill) => {
    const { _autosaveTimer } = get();
    if (_autosaveTimer) clearInterval(_autosaveTimer);
    set({
      ...initialState,
      draftId: uid("draft"),
      _autosaveTimer: null,
      composerOpen: true,
      prefill: prefill ?? null,
    });
    if (prefill) {
      get().loadDraft({
        to: prefill.to,
        cc: prefill.cc,
        bcc: prefill.bcc,
        subject: prefill.subject,
        body: prefill.body,
        inReplyTo: prefill.inReplyTo,
        references: prefill.references,
      });
    }
    get().startAutosave();
  },

  closeComposer: () => {
    get().stopAutosave();
    set({ composerOpen: false, prefill: null });
  },
}));

export { uid };
