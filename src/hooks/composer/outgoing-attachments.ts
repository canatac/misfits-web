/**
 * Helpers for turning ComposeDraft attachments into wire payloads.
 * Extracted from use-composer.ts to keep hook file under LOC budget.
 */
import type { ComposeDraft } from "@/types/composer";

export interface OutgoingAttachmentPayload {
  filename: string;
  contentType: string;
  size: number;
  dataBase64: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export async function buildOutgoingAttachments(
  draft: ComposeDraft
): Promise<OutgoingAttachmentPayload[]> {
  const out: OutgoingAttachmentPayload[] = [];
  for (const att of draft.attachments ?? []) {
    if (!att.file) continue;
    const dataBase64 = arrayBufferToBase64(await att.file.arrayBuffer());
    out.push({
      filename: att.filename,
      contentType: att.contentType || att.file.type || "application/octet-stream",
      size: att.size,
      dataBase64,
    });
  }
  return out;
}
