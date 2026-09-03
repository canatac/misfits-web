import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Email } from "@/types/email";
import { selectEmailsFromLast24h, summarizeDailyMail } from "@/lib/daily-mail-summary";

const chatCompletionDirectMock = vi.fn();

vi.mock("@/lib/ai-client", () => ({
  chatCompletionDirect: (...args: unknown[]) => chatCompletionDirectMock(...args),
}));

function email(overrides: Partial<Email> = {}): Email {
  return {
    id: "e-1",
    threadId: "t-1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    to: [{ name: "Me", address: "me@misfits.ai" }],
    subject: "Budget review",
    preview: "Please review and confirm today",
    body: "Please review and confirm today",
    bodyType: "text",
    date: "2026-09-03T10:00:00.000Z",
    receivedAt: "2026-09-03T10:00:00.000Z",
    isRead: false,
    isStarred: false,
    isImportant: true,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 512,
    messageId: "msg-1",
    ...overrides,
  };
}

describe("daily-mail-summary", () => {
  beforeEach(() => {
    chatCompletionDirectMock.mockReset();
  });

  it("filters emails to last 24h", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");
    const recent = email({ id: "r-1", receivedAt: "2026-09-03T09:00:00.000Z" });
    const old = email({ id: "o-1", receivedAt: "2026-09-02T08:59:59.000Z" });

    const out = selectEmailsFromLast24h([recent, old], now);
    expect(out.map((e) => e.id)).toEqual(["r-1"]);
  });

  it("uses AI JSON output when valid", async () => {
    chatCompletionDirectMock.mockResolvedValue({
      content: JSON.stringify({
        pendingActions: ["Répondre au client A"],
        exchangedInfo: ["Le planning de migration est confirmé"],
        priorityEmails: [{ emailId: "e-1", reason: "Deadline aujourd’hui", priorityScore: 91 }],
      }),
    });

    const result = await summarizeDailyMail([email()]);
    expect(result.source).toBe("ai");
    expect(result.pendingActions[0]).toContain("Répondre");
    expect(result.priorityEmails[0]).toMatchObject({
      emailId: "e-1",
      subject: "Budget review",
      priorityScore: 91,
    });
  });

  it("falls back to rules when AI fails", async () => {
    chatCompletionDirectMock.mockRejectedValue(new Error("boom"));
    const result = await summarizeDailyMail([
      email({ id: "e-urgent", subject: "Urgent: signature", preview: "ASAP" }),
    ]);

    expect(result.source).toBe("rules");
    expect(result.pendingActions.length).toBeGreaterThan(0);
    expect(result.priorityEmails.length).toBeGreaterThan(0);
  });
});
