import { describe, expect, it } from "vitest";
import { decodeMimeHeaderValue, normalizeEmailRecord } from "../email-normalization";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "1",
    threadId: "t1",
    folder: "inbox",
    from: { email: "test@example.com", name: "Test" },
    to: [{ email: "user@example.com", name: "User" }],
    subject: "Test",
    preview: "Test preview",
    body: "<p>Hello</p>",
    bodyType: "html",
    date: "2026-09-01T10:00:00Z",
    receivedAt: "2026-09-01T10:00:00Z",
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 1024,
    messageId: "msg-1",
    ...overrides,
  } as Email;
}

describe("decodeMimeHeaderValue", () => {
  it("returns value unchanged when no encoded words", () => {
    expect(decodeMimeHeaderValue("Hello World")).toBe("Hello World");
  });

  it("returns empty string for empty input", () => {
    expect(decodeMimeHeaderValue("")).toBe("");
  });

  it("handles null/undefined", () => {
    expect(decodeMimeHeaderValue(null as unknown as string)).toBe(null as unknown as string);
  });

  it("decodes UTF-8 Q-encoded", () => {
    expect(decodeMimeHeaderValue("=?UTF-8?Q?Hello_World?=")).toBe("Hello World");
  });

  it("decodes base64-encoded", () => {
    expect(decodeMimeHeaderValue("=?UTF-8?B?SGVsbG8=?=")).toBe("Hello");
  });

  it("decodes multiple encoded words", () => {
    expect(decodeMimeHeaderValue("=?UTF-8?Q?Hello?= =?UTF-8?Q?World?=")).toBe("Hello World");
  });

  it("handles mixed plain and encoded text", () => {
    expect(decodeMimeHeaderValue("Re: =?UTF-8?Q?Meeting_notes?=")).toBe("Re: Meeting notes");
  });
});

describe("normalizeEmailRecord", () => {
  it("decodes MIME-encoded subject", () => {
    const email = makeEmail({ subject: "=?UTF-8?Q?Hello?=" });
    const result = normalizeEmailRecord(email);
    expect(result.subject).toBe("Hello");
  });

  it("sets hasAttachments true when attachments non-empty", () => {
    const email = makeEmail({
      attachments: [{ id: "a1", filename: "file.pdf", contentType: "application/pdf", size: 1024, type: "pdf" } as any],
    });
    const result = normalizeEmailRecord(email);
    expect(result.hasAttachments).toBe(true);
  });

  it("keeps hasAttachments false when no attachments", () => {
    const result = normalizeEmailRecord(makeEmail());
    expect(result.hasAttachments).toBe(false);
  });

  it("preserves existing hasAttachments true", () => {
    const email = makeEmail({ hasAttachments: true, attachments: [] });
    const result = normalizeEmailRecord(email);
    expect(result.hasAttachments).toBe(true);
  });

  it("handles missing attachments array", () => {
    const email = { ...makeEmail(), attachments: undefined } as unknown as Email;
    const result = normalizeEmailRecord(email);
    expect(result.attachments).toEqual([]);
  });

  it("does not mutate original email", () => {
    const original = makeEmail();
    normalizeEmailRecord(original);
    expect(original.hasAttachments).toBe(false);
  });
});
