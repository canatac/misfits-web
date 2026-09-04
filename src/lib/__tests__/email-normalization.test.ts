import { describe, expect, it } from "vitest";
import { decodeMimeHeaderValue, normalizeEmailRecord } from "@/lib/email-normalization";
import type { Email } from "@/types/email";

function makeEmail(partial: Partial<Email> = {}): Email {
  return {
    id: partial.id ?? "e-1",
    threadId: partial.threadId ?? "t-1",
    folder: partial.folder ?? "sent",
    from: partial.from ?? { name: "Me", address: "me@misfits.ai" },
    to: partial.to ?? [{ name: "You", address: "you@example.com" }],
    cc: partial.cc,
    bcc: partial.bcc,
    subject: partial.subject ?? "Subject",
    preview: partial.preview ?? "preview",
    body: partial.body ?? "<p>body</p>",
    bodyType: partial.bodyType ?? "html",
    date: partial.date ?? new Date().toISOString(),
    receivedAt: partial.receivedAt ?? new Date().toISOString(),
    isRead: partial.isRead ?? false,
    isStarred: partial.isStarred ?? false,
    isImportant: partial.isImportant ?? false,
    hasAttachments: partial.hasAttachments ?? false,
    attachments: partial.attachments ?? [],
    labels: partial.labels ?? [],
    size: partial.size ?? 123,
    messageId: partial.messageId ?? "m-1",
    headers: partial.headers ?? {},
    accountId: partial.accountId,
  };
}

describe("email-normalization", () => {
  it("decodes RFC2047 Q-encoded UTF-8 subject", () => {
    expect(decodeMimeHeaderValue("=?UTF-8?Q?Lis_=C3=A7a?=")).toBe("Lis ça");
  });

  it("keeps plain subject unchanged", () => {
    expect(decodeMimeHeaderValue("Hello world")).toBe("Hello world");
  });

  it("normalizes attachment flag when attachment array is present", () => {
    const normalized = normalizeEmailRecord(
      makeEmail({
        hasAttachments: false,
        attachments: [
          {
            id: "a1",
            filename: "doc.pdf",
            contentType: "application/pdf",
            size: 12,
            type: "pdf",
          },
        ],
      })
    );

    expect(normalized.hasAttachments).toBe(true);
    expect(normalized.attachments).toHaveLength(1);
  });
});
