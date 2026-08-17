/**
 * Composer store recipient + attachment reducers — cycle 57 extraction.
 */
import type { Attachment, Recipient, RecipientType } from "@/types/composer";

type RecipList = { to: Recipient[]; cc: Recipient[]; bcc: Recipient[] };

export function addRecipientTo(
  state: RecipList,
  type: RecipientType,
  recipient: Recipient
): Partial<RecipList> | null {
  const list = state[type];
  if (list.some((r) => r.email === recipient.email)) return null;
  return { [type]: [...list, recipient] } as Partial<RecipList>;
}

export function removeRecipientFrom(
  state: RecipList,
  type: RecipientType,
  id: string
): Partial<RecipList> {
  return { [type]: state[type].filter((r) => r.id !== id) } as Partial<RecipList>;
}

export function updateAttachmentIn(
  attachments: Attachment[],
  id: string,
  patch: Partial<Attachment>
): Attachment[] {
  return attachments.map((a) => (a.id === id ? { ...a, ...patch } : a));
}

export function removeAttachmentFrom(
  attachments: Attachment[],
  id: string
): Attachment[] {
  const att = attachments.find((a) => a.id === id);
  if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
  return attachments.filter((a) => a.id !== id);
}
