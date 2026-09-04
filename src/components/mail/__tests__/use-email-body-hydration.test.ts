import { describe, expect, it } from "vitest";
import { needsEmailDetailHydration } from "@/components/mail/hooks/useEmailBodyHydration";
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

describe("needsEmailDetailHydration", () => {
  it("returns true when body is missing", () => {
    expect(needsEmailDetailHydration(makeEmail({ body: "" }))).toBe(true);
  });

  it("returns true when attachment flag is true but attachment list is empty", () => {
    expect(
      needsEmailDetailHydration(makeEmail({ hasAttachments: true, attachments: [] }))
    ).toBe(true);
  });

  it("returns false when body and attachments are already present", () => {
    expect(
      needsEmailDetailHydration(
        makeEmail({
          hasAttachments: true,
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
      )
    ).toBe(false);
  });
});
