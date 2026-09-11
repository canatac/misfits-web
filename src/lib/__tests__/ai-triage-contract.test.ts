/**
 * AI Triage Contract Tests
 *
 * Cross-repo invariant: the frontend AI triage engine must produce
 * TriageResult shapes that match the backend triage expectations
 * (reimagined-guide). Category bands, priority scoring, and action
 * suggestions must stay in sync.
 */

import { describe, it, expect } from "vitest";
import {
  categorizeEmail,
  calculatePriority,
  suggestAction,
  detectUrgentReply,
} from "@/lib/ai-triage";
import type { Email } from "@/types/email";

describe("ai-triage contract", () => {
  const baseEmail: Email = {
    id: "email-1",
    threadId: "thread-1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    to: [{ name: "User", address: "user@misfits.fr" }],
    subject: "Quick question",
    preview: "Can you review this?",
    body: "<p>Can you review this document for me?</p>",
    bodyType: "html",
    date: "2026-09-10T08:00:00Z",
    receivedAt: "2026-09-10T08:00:01Z",
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 512,
    messageId: "<email-1@example.com>",
  };

  describe("categorizeEmail", () => {
    it("categorizes newsletter emails", () => {
      const result = categorizeEmail({
        ...baseEmail,
        subject: "Weekly digest: top stories",
        preview: "This week's newsletter",
      });
      expect(result.category).toBe("newsletter");
      expect(result.confidence).toBe(0.8);
    });

    it("categorizes promo emails", () => {
      const result = categorizeEmail({
        ...baseEmail,
        subject: "50% off everything!",
        preview: "Limited time offer, sale ends soon",
      });
      expect(result.category).toBe("promo");
      expect(result.confidence).toBe(0.8);
    });

    it("categorizes notification emails", () => {
      const result = categorizeEmail({
        ...baseEmail,
        from: { name: "GitHub", address: "noreply@github.com" },
        subject: "Notification: PR merged",
        preview: "Automated alert",
      });
      expect(result.category).toBe("notification");
      expect(result.confidence).toBe(0.7);
    });

    it("categorizes social emails", () => {
      const result = categorizeEmail({
        ...baseEmail,
        subject: "New follower on LinkedIn",
        preview: "John Doe wants to connect",
      });
      expect(result.category).toBe("social");
      expect(result.confidence).toBe(0.7);
    });

    it("categorizes important emails", () => {
      const result = categorizeEmail({
        ...baseEmail,
        isImportant: true,
        subject: "Meeting notes",
        preview: "Here are the notes",
      });
      expect(result.category).toBe("important");
      expect(result.confidence).toBe(0.9);
    });

    it("categorizes work emails from misfits.ai", () => {
      const result = categorizeEmail({
        ...baseEmail,
        from: { name: "Boss", address: "ceo@misfits.ai" },
        subject: "Project update",
        preview: "Status report",
      });
      expect(result.category).toBe("work");
      expect(result.confidence).toBe(0.6);
    });

    it("categorizes personal emails as fallback", () => {
      const result = categorizeEmail({
        ...baseEmail,
        subject: "Dinner tonight?",
        preview: "Are you free?",
      });
      expect(result.category).toBe("personal");
      expect(result.confidence).toBe(0.5);
    });

    it("is case-insensitive for keywords", () => {
      const result = categorizeEmail({
        ...baseEmail,
        subject: "NEWSLETTER: Weekly Update",
        preview: "This week's digest",
      });
      expect(result.category).toBe("newsletter");
    });
  });

  describe("calculatePriority", () => {
    it("returns base score 30 for plain email", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: true,
        isImportant: false,
        isStarred: false,
        hasAttachments: false,
      });
      expect(score).toBe(30);
    });

    it("adds 30 for important emails", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: true,
        isImportant: true,
        isStarred: false,
        hasAttachments: false,
      });
      expect(score).toBe(60);
    });

    it("adds 15 for unread emails", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: false,
        isImportant: false,
        isStarred: false,
        hasAttachments: false,
      });
      expect(score).toBe(45);
    });

    it("adds 10 for starred emails", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: true,
        isImportant: false,
        isStarred: true,
        hasAttachments: false,
      });
      expect(score).toBe(40);
    });

    it("adds 5 for attachments", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: true,
        isImportant: false,
        isStarred: false,
        hasAttachments: true,
      });
      expect(score).toBe(35);
    });

    it("adds 20 for urgent keywords", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: true,
        isImportant: false,
        isStarred: false,
        hasAttachments: false,
        subject: "URGENT: Need response ASAP",
      });
      expect(score).toBe(50);
    });

    it("adds 10 for misfits.ai sender", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: true,
        isImportant: false,
        isStarred: false,
        hasAttachments: false,
        from: { name: "CEO", address: "ceo@misfits.ai" },
      });
      expect(score).toBe(40);
    });

    it("caps at 100", () => {
      const score = calculatePriority({
        ...baseEmail,
        isRead: false,
        isImportant: true,
        isStarred: true,
        hasAttachments: true,
        subject: "URGENT: deadline today",
        from: { name: "Boss", address: "ceo@misfits.ai" },
      });
      expect(score).toBeLessThanOrEqual(100);
    });

    it("does not go below 0", () => {
      const score = calculatePriority(baseEmail);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("suggestAction", () => {
    it("returns reply for high priority (>= 70)", () => {
      expect(suggestAction(baseEmail, "personal", 70)).toBe("reply");
      expect(suggestAction(baseEmail, "newsletter", 85)).toBe("reply");
    });

    it("returns archive for newsletter", () => {
      expect(suggestAction(baseEmail, "newsletter", 30)).toBe("archive");
    });

    it("returns archive for promo", () => {
      expect(suggestAction(baseEmail, "promo", 30)).toBe("archive");
    });

    it("returns archive for low-priority notification", () => {
      expect(suggestAction(baseEmail, "notification", 30)).toBe("archive");
    });

    it("returns follow_up for starred emails", () => {
      expect(
        suggestAction({ ...baseEmail, isStarred: true }, "personal", 30)
      ).toBe("follow_up");
    });

    it("returns archive as default", () => {
      expect(suggestAction(baseEmail, "personal", 30)).toBe("archive");
    });
  });

  describe("detectUrgentReply", () => {
    it("returns true for question mark in subject", () => {
      expect(
        detectUrgentReply({ ...baseEmail, subject: "Can you help?" })
      ).toBe(true);
    });

    it("returns true for please in text", () => {
      expect(
        detectUrgentReply({
          ...baseEmail,
          subject: "Document",
          preview: "Please review this",
        })
      ).toBe(true);
    });

    it("returns true for need in text", () => {
      expect(
        detectUrgentReply({
          ...baseEmail,
          subject: "Help needed",
          preview: "I need your input",
        })
      ).toBe(true);
    });

    it("returns false for neutral text", () => {
      expect(
        detectUrgentReply({
          ...baseEmail,
          subject: "Meeting notes",
          preview: "Here are the notes from today",
        })
      ).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(
        detectUrgentReply({
          ...baseEmail,
          subject: "Document",
          preview: "PLEASE review this",
        })
      ).toBe(true);
    });
  });

  describe("TriageResult shape contract", () => {
    it("categorizeEmail returns valid category + confidence", () => {
      const result = categorizeEmail(baseEmail);
      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("confidence");
      expect(typeof result.category).toBe("string");
      expect(typeof result.confidence).toBe("number");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("calculatePriority returns valid PriorityScore", () => {
      const score = calculatePriority(baseEmail);
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("suggestAction returns valid TriageAction", () => {
      const action = suggestAction(baseEmail, "personal", 30);
      expect(["reply", "archive", "follow_up"]).toContain(action);
    });

    it("priority score produces valid bands via calculation", () => {
      // Band logic: >= 80 urgent, >= 60 high, >= 30 medium, < 30 low
      const lowScore = calculatePriority({ ...baseEmail, isRead: true });
      expect(lowScore).toBe(30); // medium band
      expect(lowScore).toBeGreaterThanOrEqual(0);
      expect(lowScore).toBeLessThanOrEqual(100);
    });
  });
});
