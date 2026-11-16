/**
 * Send/schedule helpers for the composer store.
 *
 * The store calls these after a successful send to reset the draft; they are
 * kept separate so the store file stays readable.
 */
import type { SendOptions } from "@/types/composer";
import { sendEmailRequest } from "@/hooks/composer/send-email";

type SendableState = {
  draftId: string;
  to: { email: string; name?: string }[];
  cc: { email: string; name?: string }[];
  bcc: { email: string; name?: string }[];
  subject: string;
  body: string;
  attachments: { id: string; filename: string; contentType: string; size: number }[];
  signature: { id: string; name: string; html: string } | null;
  inReplyTo?: string;
  references?: string[];
};

/** Send the current draft now (or at sendLater when provided). */
export async function sendComposer(state: SendableState, options?: SendOptions): Promise<void> {
  await sendEmailRequest(
    {
      id: state.draftId,
      to: state.to.map((r) => ({ email: r.email, name: r.name })),
      cc: state.cc.map((r) => ({ email: r.email, name: r.name })),
      bcc: state.bcc.map((r) => ({ email: r.email, name: r.name })),
      subject: state.subject,
      body: state.body,
      attachments: state.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
      })),
      signature: state.signature,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inReplyTo: state.inReplyTo,
      references: state.references,
    },
    options,
  );
}

/** Schedule the current draft for later delivery. */
export async function scheduleComposer(state: SendableState, date: string): Promise<void> {
  await sendComposer(state, { sendLater: date });
}
