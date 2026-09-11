/**
 * Follow-up Detector Contract Tests
 *
 * Cross-repo invariant: the frontend follow-up detector must produce
 * FollowUpItem shapes that match the backend reminder expectations
 * (reimagined-guide). Detection rules, due date computation, and
 * deduplication must stay in sync.
 */

import { describe, it, expect } from "vitest";
import {
  detectFollowUps,
  estimateReplyDelay,
  DEFAULT_RULES,
} from "@/lib/follow-up-detector";
import type { FollowUpEmailInput, ReminderRule } from "@/types/follow-up";

describe("follow-up-detector contract", () => {
  const baseEmail: FollowUpEmailInput = {
    id: "email-1",
    threadId: "thread-1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    subject: "Quick question",
    preview: "Can you review this?",
    body: "<p>Can you review this document for me?</p>",
    date: "2026-09-10T08:00:00Z",
  };

  describe("estimateReplyDelay", () => {
    it("returns 24h default when no history", () => {
      expect(estimateReplyDelay("alice@example.com", [])).toBe(24);
    });

    it("returns 24h default with single email", () => {
      expect(estimateReplyDelay("alice@example.com", [baseEmail])).toBe(24);
    });

    it("returns 12h for frequent communicators (< 12h gap)", () => {
      const emails = [
        { ...baseEmail, date: "2026-09-10T08:00:00Z" },
        { ...baseEmail, date: "2026-09-10T14:00:00Z" },
        { ...baseEmail, date: "2026-09-10T20:00:00Z" },
      ];
      expect(estimateReplyDelay("alice@example.com", emails)).toBe(12);
    });

    it("returns 24h for daily cadence (12-48h gap)", () => {
      const emails = [
        { ...baseEmail, date: "2026-09-10T08:00:00Z" },
        { ...baseEmail, date: "2026-09-11T08:00:00Z" },
        { ...baseEmail, date: "2026-09-12T08:00:00Z" },
      ];
      expect(estimateReplyDelay("alice@example.com", emails)).toBe(24);
    });

    it("returns 48h for infrequent (> 48h gap)", () => {
      const emails = [
        { ...baseEmail, date: "2026-09-10T08:00:00Z" },
        { ...baseEmail, date: "2026-09-15T08:00:00Z" },
      ];
      expect(estimateReplyDelay("alice@example.com", emails)).toBe(48);
    });

    it("is case-insensitive for sender address", () => {
      const emails = [
        { ...baseEmail, from: { name: "Alice", address: "ALICE@example.com" }, date: "2026-09-10T08:00:00Z" },
        { ...baseEmail, from: { name: "Alice", address: "alice@example.com" }, date: "2026-09-11T08:00:00Z" },
      ];
      expect(estimateReplyDelay("alice@example.com", emails)).toBe(24);
    });
  });

  describe("detectFollowUps", () => {
    it("returns empty array for no emails", () => {
      expect(detectFollowUps([])).toEqual([]);
    });

    it("detects direct question in inbox", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "Can you help me with this?" },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("needs_reply");
      expect(result[0].senderAddress).toBe("alice@example.com");
    });

    it("detects explicit request", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "Please review this document" },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("needs_reply");
    });

    it("detects urgent flag", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "This is urgent, need response ASAP" },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("needs_reply");
    });

    it("does not detect needs_reply in sent folder", () => {
      const result = detectFollowUps([
        {
          ...baseEmail,
          folder: "sent",
          preview: "Can you review this?",
        },
      ]);
      expect(result).toHaveLength(0);
    });

    it("detects promise in sent folder", () => {
      const result = detectFollowUps([
        {
          ...baseEmail,
          folder: "sent",
          preview: "Promise to send",
          body: "<p>I'll send the report by Friday</p>",
        },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("promise");
    });

    it("does not detect promise in inbox", () => {
      const result = detectFollowUps([
        {
          ...baseEmail,
          folder: "inbox",
          preview: "Just checking in",
          body: "<p>I'll send the report by Friday</p>",
        },
      ]);
      expect(result).toHaveLength(0);
    });

    it("skips already-replied threads", () => {
      const emails = [
        { ...baseEmail, id: "e1", preview: "Can you help?" },
        {
          ...baseEmail,
          id: "e2",
          from: { name: "User", address: "user@misfits.ai" },
          preview: "Sure, what do you need?",
        },
      ];
      const result = detectFollowUps(emails);
      // Thread has 2 senders → hasReply → skip needs_reply
      expect(result).toHaveLength(0);
    });

    it("deduplicates same email + type (keeps first match)", () => {
      const result = detectFollowUps([
        {
          ...baseEmail,
          preview: "Can you review this? It's urgent and I need your help ASAP",
        },
      ]);
      // Multiple rules match but should deduplicate to 1 per type
      const needsReply = result.filter((r) => r.type === "needs_reply");
      expect(needsReply).toHaveLength(1);
    });

    it("respects custom rules", () => {
      const customRules: ReminderRule[] = [
        {
          id: "custom-test",
          name: "Custom test",
          type: "needs_reply",
          pattern: "custom-marker",
          enabled: true,
          defaultDelayHours: 1,
          weight: 50,
        },
      ];
      const result = detectFollowUps(
        [{ ...baseEmail, body: "<p>This has a custom-marker in it</p>" }],
        customRules
      );
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("needs_reply");
    });

    it("skips disabled rules", () => {
      const disabledRules: ReminderRule[] = DEFAULT_RULES.map((r) => ({
        ...r,
        enabled: false,
      }));
      const result = detectFollowUps(
        [{ ...baseEmail, preview: "Can you review this?" }],
        disabledRules
      );
      expect(result).toHaveLength(0);
    });

    it("handles invalid regex patterns gracefully", () => {
      const invalidRules: ReminderRule[] = [
        {
          id: "invalid",
          name: "Invalid",
          type: "needs_reply",
          pattern: "[invalid-regex",
          enabled: true,
          defaultDelayHours: 1,
          weight: 50,
        },
      ];
      const result = detectFollowUps(
        [{ ...baseEmail, preview: "Can you review this?" }],
        invalidRules
      );
      expect(result).toHaveLength(0);
    });

    it("sets due date based on rule delay", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "Can you review this?" },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].dueDate).toBeDefined();
      // Due date should be in the future relative to email date
      expect(new Date(result[0].dueDate).getTime()).toBeGreaterThan(
        new Date(baseEmail.date).getTime()
      );
    });

    it("sets status to pending", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "Can you help?" },
      ]);
      expect(result[0].status).toBe("pending");
    });

    it("includes reasoning text", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "Can you review this?" },
      ]);
      expect(result[0].reasoning).toBeDefined();
      expect(typeof result[0].reasoning).toBe("string");
      expect(result[0].reasoning.length).toBeGreaterThan(0);
    });

    it("sets confidence to 0.7", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "Can you help?" },
      ]);
      expect(result[0].confidence).toBe(0.7);
    });

    it("sets source to rules", () => {
      const result = detectFollowUps([
        { ...baseEmail, preview: "Can you help?" },
      ]);
      expect(result[0].source).toBe("rules");
    });
  });

  describe("DEFAULT_RULES", () => {
    it("has at least 5 rules", () => {
      expect(DEFAULT_RULES.length).toBeGreaterThanOrEqual(5);
    });

    it("all rules have required fields", () => {
      for (const rule of DEFAULT_RULES) {
        expect(rule).toHaveProperty("id");
        expect(rule).toHaveProperty("name");
        expect(rule).toHaveProperty("type");
        expect(rule).toHaveProperty("pattern");
        expect(rule).toHaveProperty("enabled");
        expect(rule).toHaveProperty("defaultDelayHours");
        expect(rule).toHaveProperty("weight");
        expect(["needs_reply", "promise"]).toContain(rule.type);
      }
    });

    it("all patterns are valid regex", () => {
      for (const rule of DEFAULT_RULES) {
        expect(() => new RegExp(rule.pattern)).not.toThrow();
      }
    });

    it("urgent rule has shortest delay", () => {
      const urgentRule = DEFAULT_RULES.find((r) => r.id === "rule-urgent-flag");
      expect(urgentRule).toBeDefined();
      expect(urgentRule!.defaultDelayHours).toBeLessThanOrEqual(4);
    });
  });
});
