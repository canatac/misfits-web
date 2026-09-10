/**
 * Unit tests for scheduled send utility.
 */
import { describe, it, expect } from "vitest";
import {
  createScheduledEmail,
  validateScheduleTime,
  isScheduledEmailDue,
  canCancelScheduled,
  cancelScheduledEmail,
  markScheduledAsSent,
  markScheduledAsFailed,
  getDueScheduledEmails,
  getPendingScheduledEmails,
  sortScheduledByTime,
  computeScheduledStats,
  getMinScheduleHours,
  formatScheduledTime,
  getScheduledStatusLabel,
} from "@/lib/scheduled-send";

describe("scheduled-send", () => {
  describe("createScheduledEmail", () => {
    it("creates scheduled email with pending status", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(scheduled.id).toBeDefined();
      expect(scheduled.emailId).toBe("e1");
      expect(scheduled.status).toBe("pending");
    });
  });

  describe("validateScheduleTime", () => {
    it("accepts valid future date", () => {
      const future = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const result = validateScheduleTime(future);
      expect(result.valid).toBe(true);
    });

    it("rejects past date", () => {
      const past = new Date(Date.now() - 60000).toISOString();
      const result = validateScheduleTime(past);
      expect(result.valid).toBe(false);
    });

    it("rejects date less than 24h in advance", () => {
      const tooSoon = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const result = validateScheduleTime(tooSoon);
      expect(result.valid).toBe(false);
    });

    it("rejects invalid date", () => {
      const result = validateScheduleTime("invalid");
      expect(result.valid).toBe(false);
    });
  });

  describe("isScheduledEmailDue", () => {
    it("returns true for past pending email", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() - 60000).toISOString(),
      });
      expect(isScheduledEmailDue(scheduled)).toBe(true);
    });

    it("returns false for future pending email", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(isScheduledEmailDue(scheduled)).toBe(false);
    });

    it("returns false for non-pending status", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() - 60000).toISOString(),
      });
      scheduled.status = "sent";
      expect(isScheduledEmailDue(scheduled)).toBe(false);
    });
  });

  describe("canCancelScheduled", () => {
    it("returns true for pending", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(canCancelScheduled(scheduled)).toBe(true);
    });

    it("returns false for sent", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      scheduled.status = "sent";
      expect(canCancelScheduled(scheduled)).toBe(false);
    });
  });

  describe("cancelScheduledEmail", () => {
    it("cancels pending email", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      const cancelled = cancelScheduledEmail(scheduled);
      expect(cancelled.status).toBe("cancelled");
    });

    it("does not cancel non-pending email", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      scheduled.status = "sent";
      const result = cancelScheduledEmail(scheduled);
      expect(result.status).toBe("sent");
    });
  });

  describe("markScheduledAsSent", () => {
    it("marks as sent with timestamp", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      const sent = markScheduledAsSent(scheduled);
      expect(sent.status).toBe("sent");
      expect(sent.sentAt).toBeDefined();
    });
  });

  describe("markScheduledAsFailed", () => {
    it("marks as failed with error", () => {
      const scheduled = createScheduledEmail({
        emailId: "e1",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
      const failed = markScheduledAsFailed(scheduled, "SMTP error");
      expect(failed.status).toBe("failed");
      expect(failed.error).toBe("SMTP error");
    });
  });

  describe("getDueScheduledEmails", () => {
    it("returns only due emails", () => {
      const emails = [
        createScheduledEmail({ emailId: "e1", scheduledAt: new Date(Date.now() - 60000).toISOString() }),
        createScheduledEmail({ emailId: "e2", scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
      ];
      const due = getDueScheduledEmails(emails);
      expect(due).toHaveLength(1);
      expect(due[0].emailId).toBe("e1");
    });
  });

  describe("getPendingScheduledEmails", () => {
    it("returns only pending emails", () => {
      const emails = [
        createScheduledEmail({ emailId: "e1", scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
        createScheduledEmail({ emailId: "e2", scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
      ];
      emails[1].status = "sent";
      const pending = getPendingScheduledEmails(emails);
      expect(pending).toHaveLength(1);
    });
  });

  describe("sortScheduledByTime", () => {
    it("sorts by scheduled time", () => {
      const emails = [
        createScheduledEmail({ emailId: "e1", scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
        createScheduledEmail({ emailId: "e2", scheduledAt: new Date(Date.now() + 3600000).toISOString() }),
      ];
      const sorted = sortScheduledByTime(emails);
      expect(sorted[0].emailId).toBe("e2");
      expect(sorted[1].emailId).toBe("e1");
    });
  });

  describe("computeScheduledStats", () => {
    it("computes correct stats", () => {
      const emails = [
        createScheduledEmail({ emailId: "e1", scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
        createScheduledEmail({ emailId: "e2", scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
        createScheduledEmail({ emailId: "e3", scheduledAt: new Date(Date.now() + 86400000).toISOString() }),
      ];
      emails[0].status = "sent";
      emails[1].status = "cancelled";
      const stats = computeScheduledStats(emails);
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.sent).toBe(1);
      expect(stats.cancelled).toBe(1);
    });
  });

  describe("getMinScheduleHours", () => {
    it("returns 24", () => {
      expect(getMinScheduleHours()).toBe(24);
    });
  });

  describe("formatScheduledTime", () => {
    it("formats time for display", () => {
      const formatted = formatScheduledTime(new Date(Date.now() + 86400000).toISOString());
      expect(formatted).toMatch(/\w+, \w+ \d+/);
    });
  });

  describe("getScheduledStatusLabel", () => {
    it("returns correct labels", () => {
      expect(getScheduledStatusLabel("pending")).toBe("Scheduled");
      expect(getScheduledStatusLabel("sent")).toBe("Sent");
      expect(getScheduledStatusLabel("cancelled")).toBe("Cancelled");
      expect(getScheduledStatusLabel("failed")).toBe("Failed");
    });
  });
});
