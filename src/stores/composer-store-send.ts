/**
 * Send/schedule helpers for the composer store.
 *
 * The store calls these to send the current draft; they are kept separate so
 * the store file stays readable. The wire payload is built by sendEmailRequest,
 * which expects a complete ComposeDraft.
 */
import type { ComposeDraft, SendOptions } from "@/types/composer";
import { sendEmailRequest } from "@/hooks/composer/send-email";

/** Minimal state shape needed to build a draft for sending. */
export interface SendableState {
  draftId: string;
  to: { id: string; email: string; name?: string; type: "to" | "cc" | "bcc" }[];
  cc: { id: string; email: string; name?: string; type: "to" | "cc" | "bcc" }[];
  bcc: { id: string; email: string; name?: string; type: "to" | "cc" | "bcc" }[];
  subject: string;
  body: string;
  attachments: {
    id: string;
    filename: string;
    contentType: string;
    size: number;
    progress: number;
    status: "pending" | "uploading" | "done" | "error";
  }[];
  signature: { id: string; name: string; html: string } | null;
  inReplyTo?: string;
  references?: string[];
}

/** Build a serialisable ComposeDraft from the current composer state. */
function toDraft(state: SendableState): ComposeDraft {
  const now = new Date().toISOString();
  return {
    id: state.draftId,
    to: state.to,
    cc: state.cc,
    bcc: state.bcc,
    subject: state.subject,
    body: state.body,
    attachments: state.attachments,
    signature: state.signature,
    createdAt: now,
    updatedAt: now,
    inReplyTo: state.inReplyTo,
    references: state.references,
  };
}

/** Send the current draft now (or at sendLater when provided). */
export async function sendComposer(state: SendableState, options?: SendOptions): Promise<void> {
  await sendEmailRequest(toDraft(state), options);
}

/** Schedule the current draft for later delivery. */
export async function scheduleComposer(state: SendableState, date: string): Promise<void> {
  await sendComposer(state, { sendLater: date });
}
