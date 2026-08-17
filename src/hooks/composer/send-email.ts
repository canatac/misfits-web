/**
 * Send-email helper: builds the outgoing payload and performs the fetch.
 * Extracted from `useSendEmail` in `use-composer.ts` to keep hook file lean.
 */
import type { ComposeDraft, SendOptions } from "@/types/composer";
import { mailAuthHeaders } from "@/lib/mail-api";
import { buildOutgoingAttachments } from "./outgoing-attachments";

export type SendEmailResult = {
  id: string;
  messageId?: string;
  sent?: boolean;
  deliveryState?: string;
  raw?: string;
  [k: string]: unknown;
};

export async function sendEmailRequest(
  draft: ComposeDraft,
  options?: SendOptions,
): Promise<SendEmailResult | unknown> {
  const endpoint = options?.sendLater ? "/api/send/schedule" : "/api/send";
  const attachments = await buildOutgoingAttachments(draft);
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
      attachments,
      inReplyTo: draft.inReplyTo,
      references: draft.references,
      ...options,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(errBody || `Send failed: ${res.status} ${res.statusText}`);
  }

  const responseText = await res.text().catch(() => "");
  if (!responseText) {
    return {
      id: draft.id,
      messageId: res.headers.get("x-message-id") ?? draft.id,
      sent: true,
      deliveryState: "sent",
    };
  }
  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return {
      id: draft.id,
      messageId: draft.id,
      sent: true,
      deliveryState: "sent",
      raw: responseText,
    };
  }
}
