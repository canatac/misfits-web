import { describe, expect, it } from "vitest";
import {
  SmartNotificationManager,
  createSmartNotificationManager,
  DEFAULT_RULES,
  type NotificationContext,
} from "../smart-notification-manager";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    to: [{ address: "user@misfits.ai", name: "User" }],
    subject: "Hello",
    preview: "Hi there",
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

function makeContext(overrides: Partial<NotificationContext> = {}): NotificationContext {
  return {
    isContact: false,
    isKnownSender: false,
    isNewsletter: false,
    isAutomated: false,
    hasUserRepliedTo: false,
    ...overrides,
  };
}

describe("SmartNotificationManager", () => {
  it("notifies immediately for known contacts", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    const ctx = makeContext({ isContact: true });
    const result = mgr.evaluate(email, ctx);
    expect(result.policy).toBe("immediate");
    expect(result.ruleId).toBe("rule-known-contact");
  });

  it("suppresses spam classified by AI", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    const ctx = makeContext({ classification: "spam" });
    const result = mgr.evaluate(email, ctx);
    expect(result.policy).toBe("suppressed");
  });

  it("batches newsletters to digest", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    const ctx = makeContext({ isNewsletter: true });
    const result = mgr.evaluate(email, ctx);
    expect(result.policy).toBe("batched");
  });

  it("suppresses automated notifications", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    const ctx = makeContext({ isAutomated: true });
    const result = mgr.evaluate(email, ctx);
    expect(result.policy).toBe("suppressed");
  });

  it("marks unknown senders as pending", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail({ from: { name: "Stranger", address: "stranger@unknown.com" } });
    const ctx = makeContext();
    const result = mgr.evaluate(email, ctx);
    expect(result.policy).toBe("pending");
  });

  it("notifies for known senders (non-contact)", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    const ctx = makeContext({ isKnownSender: true });
    const result = mgr.evaluate(email, ctx);
    expect(result.policy).toBe("immediate");
  });

  it("tracks digest entries", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    mgr.evaluate(email, makeContext({ isNewsletter: true }));
    const entries = mgr.getDigestEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].emailId).toBe("e1");
  });

  it("tracks suppressed count", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    mgr.evaluate(email, makeContext({ classification: "spam" }));
    mgr.evaluate(email, makeContext({ isAutomated: true }));
    expect(mgr.getSuppressedCount()).toBe(2);
  });

  it("tracks pending senders", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail({ from: { name: "X", address: "x@new.com" } });
    mgr.evaluate(email, makeContext());
    const pending = mgr.getPendingSenders();
    expect(pending).toContain("x@new.com");
  });

  it("clearDigest empties entries and returns them", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail();
    mgr.evaluate(email, makeContext({ isNewsletter: true }));
    const cleared = mgr.clearDigest();
    expect(cleared).toHaveLength(1);
    expect(mgr.getDigestEntries()).toHaveLength(0);
  });

  it("supports custom rules", () => {
    const mgr = createSmartNotificationManager();
    mgr.addRule({
      id: "custom",
      name: "Custom rule",
      priority: 200,
      matches: () => true,
      action: "suppressed",
    });
    const result = mgr.evaluate(makeEmail(), makeContext());
    expect(result.policy).toBe("suppressed");
    expect(result.ruleId).toBe("custom");
  });

  it("removeRule removes by id", () => {
    const mgr = createSmartNotificationManager();
    expect(mgr.removeRule("rule-newsletter")).toBe(true);
    expect(mgr.removeRule("nonexistent")).toBe(false);
  });

  it("has 6 default rules", () => {
    expect(DEFAULT_RULES).toHaveLength(6);
  });

  it("user who gets replied to is treated as contact", () => {
    const mgr = createSmartNotificationManager();
    const email = makeEmail({ from: { name: "Bob", address: "bob@example.com" } });
    const ctx = makeContext({ hasUserRepliedTo: true });
    const result = mgr.evaluate(email, ctx);
    expect(result.policy).toBe("immediate");
  });
});
