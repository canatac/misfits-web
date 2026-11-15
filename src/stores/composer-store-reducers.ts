/**
 * Pure reducer helpers for the composer store (recipients, attachments).
 * Kept separate so the store file stays focused on state and actions.
 */
import type { Attachment, Recipient, RecipientType } from "@/types/composer";
import { uid } from "./composer-store-helpers";

interface RecipientSlice {
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
}

/** Append a recipient, replacing it when the same id is already present. */
export function addRecipientTo(
  state: RecipientSlice,
  type: RecipientType,
  recipient: Recipient,
): Partial<RecipientSlice> | null {
  const list = state[type];
  if (list.some((r) => r.id === recipient.id)) return null;
  return { [type]: [...list, recipient] } as Partial<RecipientSlice>;
}

/** Remove a recipient by id. */
export function removeRecipientFrom(
  state: RecipientSlice,
  type: RecipientType,
  id: string,
): Partial<RecipientSlice> {
  return { [type]: state[type].filter((r) => r.id !== id) } as Partial<RecipientSlice>;
}

/** Patch an attachment by id. */
export function updateAttachmentIn(
  attachments: Attachment[],
  id: string,
  patch: Partial<Attachment>,
): Attachment[] {
  return attachments.map((a) => (a.id === id ? { ...a, ...patch } : a));
}

/** Remove an attachment by id, revoking its preview URL if any. */
export function removeAttachmentFrom(
  attachments: Attachment[],
  id: string,
): Attachment[] {
  const target = attachments.find((a) => a.id === id);
  if (target?.previewUrl) {
    try { URL.revokeObjectURL(target.previewUrl); } catch { /* ignore */ }
  }
  return attachments.filter((a) => a.id !== id);
}

/** Build a recipient with a generated id. */
export function makeRecipient(email: string, type: RecipientType, name?: string): Recipient {
  return { id: uid("r"), email, type, name };
}
