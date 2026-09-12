import { describe, expect, it } from "vitest";
import { estimateReplyDelay, detectFollowUps, DEFAULT_RULES } from "../follow-up-detector";
import type { FollowUpEmailInput } from "@/types/follow-up";

function makeEmail(overrides: Partial<FollowUpEmailInput> = {}): FollowUpEmailInput {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    subject: "Test",
    body: "Test body",
    date: "2026-09-01T10:00:00Z",
    ...overrides,
  };
}

describe("estimateReplyDelay", () => {
  it("returns 24h default with no history", () => {
    expect(estimateReplyDelay("alice@example.com", [])).toBe(24);
  });

  it("returns 24h with <2 emails from sender", () => {
    const history = [makeEmail({ from: { name: "Alice", email: "alice@example.com" } })];
    expect(estimateReplyDelay("alice@example.com", history)).toBe(24);
  });

  it("returns 12h for frequent communicators (<12h gap)", () => {
    const history = [
      makeEmail({ from: { name: "Alice", email: "alice@example.com" }, date: "2026-09-01T08:00:00Z" }),
      makeEmail({ from: { name: "Alice", email: "alice@example.com" }, date: "2026-09-01T14:00:00Z" }),
    ];
    expect(estimateReplyDelay("alice@example.com", history)).toBe(12);
  });

  it("returns 24h for daily cadence", () => {
    const history = [
      makeEmail({ from: { name: "Alice", email: "alice@example.com" }, date: "2026-09-01T08:00:00Z" }),
      makeEmail({ from: { name: "Alice", email: "alice@example.com" }, date: "2026-09-02T08:00:00Z" }),
    ];
    expect(estimateReplyDelay("alice@example.com", history)).toBe(24);
  });

  it("returns 48h for infrequent senders (>48h gap)", () => {
    const history = [
      makeEmail({ from: { name: "Alice", email: "alice@example.com" }, date: "2026-09-01T08:00:00Z" }),
      makeEmail({ from: { name: "Alice", email: "alice@example.com" }, date: "2026-09-05T08:00:00Z" }),
    ];
    expect(estimateReplyDelay("alice@example.com", history)).toBe(48);
  });
});

describe("detectFollowUps", () => {
  it("detects direct question in inbox", () => {
    const emails = [makeEmail({ body: "Can you help me with this?" })];
    const items = detectFollowUps(emails);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].type).toBe("needs_reply");
  });

  it("detects urgent flag", () => {
    const emails = [makeEmail({ body: "This is urgent, please reply ASAP" })];
    const items = detectFollowUps(emails);
    expect(items.length).toBeGreaterThan(0);
  });

  it("skips sent emails for needs_reply", () => {
    const emails = [makeEmail({ folder: "sent", body: "Can you help?" })];
    const items = detectFollowUps(emails);
    expect(items.every((i) => i.type !== "needs_reply")).toBe(true);
  });

  it("detects promise in sent emails", () => {
    const emails = [makeEmail({ folder: "sent", body: "I'll send the report by Friday" })];
    const items = detectFollowUps(emails);
    const promiseItem = items.find((i) => i.type === "promise");
    expect(promiseItem).toBeDefined();
  });

  it("skips already-replied threads", () => {
    const emails = [
      makeEmail({ id: "e1", threadId: "t1", from: { name: "Alice", email: "alice@example.com" }, body: "Can you help?" }),
      makeEmail({ id: "e2", threadId: "t1", from: { name: "Me", email: "me@misfits.ai" }, body: "Re: Can you help?" }),
    ];
    const items = detectFollowUps(emails);
    expect(items.find((i) => i.emailId === "e1")).toBeUndefined();
  });

  it("deduplicates multiple rule matches per email+type", () => {
    const emails = [makeEmail({ body: "Can you review this? It's urgent!" })];
    const items = detectFollowUps(emails);
    const needsReply = items.filter((i) => i.type === "needs_reply");
    const uniqueEmails = new Set(needsReply.map((i) => i.emailId));
    expect(needsReply.length).toBe(uniqueEmails.size);
  });

  it("returns empty for empty email list", () => {
    expect(detectFollowUps([])).toEqual([]);
  });

  it("detects explicit requests", () => {
    const emails = [makeEmail({ body: "Please review the attached document" })];
    const items = detectFollowUps(emails);
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("DEFAULT_RULES", () => {
  it("has 6 rules", () => {
    expect(DEFAULT_RULES).toHaveLength(6);
  });

  it("all rules are enabled by default", () => {
    expect(DEFAULT_RULES.every((r) => r.enabled)).toBe(true);
  });

  it("has unique ids", () => {
    const ids = DEFAULT_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
