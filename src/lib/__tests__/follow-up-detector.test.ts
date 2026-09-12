import { describe, expect, it } from "vitest";
import { estimateReplyDelay, detectFollowUps, DEFAULT_RULES } from "../follow-up-detector";

describe("estimateReplyDelay", () => {
  it("returns 24h default with no history", () => {
    expect(estimateReplyDelay("alice@example.com", [])).toBe(24);
  });

  it("returns 24h with <2 emails from sender", () => {
    const history = [{ id: "e1", from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-01" }];
    expect(estimateReplyDelay("alice@example.com", history as any)).toBe(24);
  });

  it("returns 12h for frequent communicators (<12h gap)", () => {
    const history = [
      { id: "e1", from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-01T08:00:00Z" },
      { id: "e2", from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-01T14:00:00Z" },
    ];
    expect(estimateReplyDelay("alice@example.com", history as any)).toBe(12);
  });

  it("returns 24h for daily cadence", () => {
    const history = [
      { id: "e1", from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-01T08:00:00Z" },
      { id: "e2", from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-02T08:00:00Z" },
    ];
    expect(estimateReplyDelay("alice@example.com", history as any)).toBe(24);
  });

  it("returns 48h for infrequent senders (>48h gap)", () => {
    const history = [
      { id: "e1", from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-01T08:00:00Z" },
      { id: "e2", from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-05T08:00:00Z" },
    ];
    expect(estimateReplyDelay("alice@example.com", history as any)).toBe(48);
  });
});

describe("detectFollowUps", () => {
  it("detects direct question in inbox", () => {
    const emails = [{ id: "e1", threadId: "t1", folder: "inbox", from: { name: "Alice", address: "alice@example.com" }, subject: "Q?", body: "Can you help me with this?", date: "2026-09-01T10:00:00Z" }];
    const items = detectFollowUps(emails as any);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].type).toBe("needs_reply");
  });

  it("returns empty for empty email list", () => {
    expect(detectFollowUps([])).toEqual([]);
  });

  it("detects explicit requests", () => {
    const emails = [{ id: "e1", threadId: "t1", folder: "inbox", from: { name: "Alice", address: "alice@example.com" }, subject: "Review", body: "Please review the attached document", date: "2026-09-01T10:00:00Z" }];
    const items = detectFollowUps(emails as any);
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
