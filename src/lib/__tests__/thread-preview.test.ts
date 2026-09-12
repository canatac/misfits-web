import { describe, it, expect } from "vitest";
import {
  stripForPreview,
  truncatePreview,
  buildParticipantSummary,
  buildThreadPreview,
  buildThreadPreviewSmart,
  selectPreviewMessage,
  DEFAULT_PREVIEW_LENGTH,
} from "@/lib/thread-preview";
import type { Thread } from "@/types/thread";
import type { Email, EmailAddress } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    to: [{ name: "Me", address: "me@misfits.ai" }],
    subject: "Subject",
    preview: "Preview",
    body: "Hello world",
    bodyType: "text",
    date: "2026-01-15T09:00:00Z",
    receivedAt: "2026-01-15T09:00:00Z",
    isRead: true,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 100,
    messageId: "<msg1@example.com>",
    ...overrides,
  };
}

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: "t1",
    subject: "Test Thread",
    messages: [makeEmail()],
    participants: [{ name: "Alice", address: "alice@example.com" }],
    lastMessageDate: "2026-01-15T09:00:00Z",
    firstMessageDate: "2026-01-15T09:00:00Z",
    unreadCount: 0,
    messageCount: 1,
    hasAttachments: false,
    labels: [],
    folder: "inbox",
    ...overrides,
  };
}

describe("stripForPreview", () => {
  it("strips HTML tags", () => {
    expect(stripForPreview("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("decodes HTML entities", () => {
    expect(stripForPreview("Hello&nbsp;world &amp; friends")).toBe("Hello world friends");
  });

  it("collapses whitespace", () => {
    expect(stripForPreview("Hello   world")).toBe("Hello world");
    expect(stripForPreview("\n  Hello \n  world  \n")).toBe("Hello world");
  });

  it("handles plain text passthrough", () => {
    expect(stripForPreview("Hello world")).toBe("Hello world");
  });

  it("handles empty string", () => {
    expect(stripForPreview("")).toBe("");
  });
});

describe("truncatePreview", () => {
  it("does not truncate short text", () => {
    expect(truncatePreview("Short text", 100)).toBe("Short text");
  });

  it("truncates long text with ellipsis", () => {
    const long = "a".repeat(200);
    const result = truncatePreview(long, DEFAULT_PREVIEW_LENGTH);
    expect(result.length).toBe(DEFAULT_PREVIEW_LENGTH + 1);
    expect(result.endsWith("…")).toBe(true);
  });

  it("handles exact-length text", () => {
    const exact = "a".repeat(DEFAULT_PREVIEW_LENGTH);
    expect(truncatePreview(exact, DEFAULT_PREVIEW_LENGTH)).toBe(exact);
  });

  it("trims trailing whitespace before ellipsis", () => {
    const text = "Hello world     and more text here to be truncated properly";
    const result = truncatePreview(text, 20);
    expect(result).toBe("Hello world and more…");
  });
});

describe("buildParticipantSummary", () => {
  it("returns empty string for empty list", () => {
    expect(buildParticipantSummary([])).toBe("");
  });

  it("returns single name", () => {
    expect(buildParticipantSummary(["Alice"])).toBe("Alice");
  });

  it("joins two names", () => {
    expect(buildParticipantSummary(["Alice", "Bob"])).toBe("Alice, Bob");
  });

  it("joins three names", () => {
    expect(buildParticipantSummary(["Alice", "Bob", "Charlie"])).toBe("Alice, Bob, Charlie");
  });

  it("shows overflow for four names", () => {
    expect(buildParticipantSummary(["Alice", "Bob", "Charlie", "Dave"])).toBe(
      "Alice, Bob, Charlie +1"
    );
  });

  it("shows overflow for many names", () => {
    expect(
      buildParticipantSummary(["A", "B", "C", "D", "E"])
    ).toBe("A, B, C +2");
  });
});

describe("buildThreadPreview", () => {
  it("builds preview from last message", () => {
    const thread = makeThread({
      messages: [
        makeEmail({ body: "First message", date: "2026-01-15T08:00:00Z" }),
        makeEmail({ body: "Last message", date: "2026-01-15T09:00:00Z" }),
      ],
      messageCount: 2,
    });

    const preview = buildThreadPreview(thread);
    expect(preview.previewText).toBe("Last message");
    expect(preview.messageCount).toBe(2);
    expect(preview.subject).toBe("Test Thread");
  });

  it("truncates long body text", () => {
    const longBody = "x".repeat(200);
    const thread = makeThread({
      messages: [makeEmail({ body: longBody })],
    });

    const preview = buildThreadPreview(thread);
    expect(preview.previewText.length).toBe(DEFAULT_PREVIEW_LENGTH + 1);
  });

  it("uses sender name when available", () => {
    const thread = makeThread();
    const preview = buildThreadPreview(thread);
    expect(preview.lastSender).toBe("Alice");
  });

  it("uses sender address when no name", () => {
    const email = makeEmail({ from: { name: "", address: "unknown@example.com" } });
    const thread = makeThread({ messages: [email] });
    const preview = buildThreadPreview(thread);
    expect(preview.lastSender).toBe("unknown@example.com");
  });

  it("summarises participants", () => {
    const participants: EmailAddress[] = [
      { name: "Alice", address: "alice@example.com" },
      { name: "Bob", address: "bob@example.com" },
    ];
    const thread = makeThread({ participants });
    const preview = buildThreadPreview(thread);
    expect(preview.participantSummary).toBe("Alice, Bob");
  });
});

describe("selectPreviewMessage", () => {
  it("returns null for empty thread", () => {
    const thread = makeThread({ messages: [] });
    expect(selectPreviewMessage(thread)).toBeNull();
  });

  it("selects last message when all read", () => {
    const emails = [
      makeEmail({ id: "e1", isRead: true }),
      makeEmail({ id: "e2", isRead: true }),
      makeEmail({ id: "e3", isRead: true }),
    ];
    const thread = makeThread({ messages: emails });
    expect(selectPreviewMessage(thread)?.id).toBe("e3");
  });

  it("selects most recent unread message", () => {
    const emails = [
      makeEmail({ id: "e1", isRead: false }),
      makeEmail({ id: "e2", isRead: true }),
      makeEmail({ id: "e3", isRead: false }),
    ];
    const thread = makeThread({ messages: emails });
    expect(selectPreviewMessage(thread)?.id).toBe("e3");
  });
});

describe("buildThreadPreviewSmart", () => {
  it("prefers unread message for preview", () => {
    const emails = [
      makeEmail({ id: "e1", body: "Read message", isRead: true }),
      makeEmail({ id: "e2", body: "Unread message", isRead: false }),
    ];
    const thread = makeThread({ messages: emails, unreadCount: 1 });
    const preview = buildThreadPreviewSmart(thread);
    expect(preview.previewText).toBe("Unread message");
    expect(preview.unreadCount).toBe(1);
  });

  it("returns safe defaults for empty thread", () => {
    const thread = makeThread({ messages: [], unreadCount: 0 });
    const preview = buildThreadPreviewSmart(thread);
    expect(preview.previewText).toBe("");
    expect(preview.lastSender).toBe("");
    expect(preview.messageCount).toBe(0);
  });
});
