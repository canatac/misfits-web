/**
 * Unit tests for first-time sender screening.
 */
import { describe, it, expect } from "vitest";
import {
  createSenderRecord,
  isSenderKnown,
  isSenderAllowed,
  isSenderBlocked,
  isSenderFeed,
  allowSender,
  blockSender,
  moveSenderToFeed,
  recordSenderEmail,
  getPendingSenders,
  getAllowedSenders,
  getBlockedSenders,
  getFeedSenders,
  findSenderByEmail,
  applyScreeningAction,
  getDefaultScreeningSettings,
  updateScreeningSettings,
  getSenderStatusLabel,
  getSenderStatusColor,
  shouldScreenEmail,
  shouldBlockEmail,
  getPendingCount,
  sortPendingByDate,
  bulkApplyAction,
} from "@/lib/sender-screening";

describe("sender-screening", () => {
  describe("createSenderRecord", () => {
    it("creates pending sender", () => {
      const sender = createSenderRecord("test@example.com", "Test");
      expect(sender.status).toBe("pending");
      expect(sender.email).toBe("test@example.com");
      expect(sender.emailCount).toBe(1);
    });
  });

  describe("isSenderKnown", () => {
    it("returns false for pending", () => {
      expect(isSenderKnown(createSenderRecord("test@example.com"))).toBe(false);
    });

    it("returns true for allowed", () => {
      expect(isSenderKnown(allowSender(createSenderRecord("test@example.com")))).toBe(true);
    });
  });

  describe("isSenderAllowed", () => {
    it("returns true for allowed sender", () => {
      expect(isSenderAllowed(allowSender(createSenderRecord("test@example.com")))).toBe(true);
    });
  });

  describe("isSenderBlocked", () => {
    it("returns true for blocked sender", () => {
      expect(isSenderBlocked(blockSender(createSenderRecord("test@example.com")))).toBe(true);
    });
  });

  describe("isSenderFeed", () => {
    it("returns true for feed sender", () => {
      expect(isSenderFeed(moveSenderToFeed(createSenderRecord("test@example.com")))).toBe(true);
    });
  });

  describe("allowSender", () => {
    it("sets status to allowed", () => {
      const sender = allowSender(createSenderRecord("test@example.com"));
      expect(sender.status).toBe("allowed");
      expect(sender.decidedAt).toBeDefined();
    });
  });

  describe("blockSender", () => {
    it("sets status to blocked", () => {
      const sender = blockSender(createSenderRecord("test@example.com"));
      expect(sender.status).toBe("blocked");
    });
  });

  describe("moveSenderToFeed", () => {
    it("sets status to feed", () => {
      const sender = moveSenderToFeed(createSenderRecord("test@example.com"));
      expect(sender.status).toBe("feed");
    });
  });

  describe("recordSenderEmail", () => {
    it("increments email count", () => {
      const sender = createSenderRecord("test@example.com");
      const updated = recordSenderEmail(sender);
      expect(updated.emailCount).toBe(2);
    });
  });

  describe("getPendingSenders", () => {
    it("returns only pending", () => {
      const senders = [
        createSenderRecord("a@example.com"),
        allowSender(createSenderRecord("b@example.com")),
      ];
      expect(getPendingSenders(senders)).toHaveLength(1);
    });
  });

  describe("getAllowedSenders", () => {
    it("returns only allowed", () => {
      const senders = [
        createSenderRecord("a@example.com"),
        allowSender(createSenderRecord("b@example.com")),
      ];
      expect(getAllowedSenders(senders)).toHaveLength(1);
    });
  });

  describe("getBlockedSenders", () => {
    it("returns only blocked", () => {
      const senders = [
        createSenderRecord("a@example.com"),
        blockSender(createSenderRecord("b@example.com")),
      ];
      expect(getBlockedSenders(senders)).toHaveLength(1);
    });
  });

  describe("getFeedSenders", () => {
    it("returns only feed", () => {
      const senders = [
        createSenderRecord("a@example.com"),
        moveSenderToFeed(createSenderRecord("b@example.com")),
      ];
      expect(getFeedSenders(senders)).toHaveLength(1);
    });
  });

  describe("findSenderByEmail", () => {
    it("finds sender by email", () => {
      const senders = [createSenderRecord("test@example.com")];
      const found = findSenderByEmail(senders, "test@example.com");
      expect(found).toBeDefined();
    });

    it("is case insensitive", () => {
      const senders = [createSenderRecord("test@example.com")];
      const found = findSenderByEmail(senders, "TEST@EXAMPLE.COM");
      expect(found).toBeDefined();
    });
  });

  describe("applyScreeningAction", () => {
    it("applies allow action", () => {
      const sender = applyScreeningAction(createSenderRecord("test@example.com"), "allow");
      expect(sender.status).toBe("allowed");
    });

    it("applies block action", () => {
      const sender = applyScreeningAction(createSenderRecord("test@example.com"), "block");
      expect(sender.status).toBe("blocked");
    });

    it("applies feed action", () => {
      const sender = applyScreeningAction(createSenderRecord("test@example.com"), "feed");
      expect(sender.status).toBe("feed");
    });
  });

  describe("getDefaultScreeningSettings", () => {
    it("returns default settings", () => {
      const settings = getDefaultScreeningSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.autoAllowContacts).toBe(true);
    });
  });

  describe("updateScreeningSettings", () => {
    it("updates settings", () => {
      const settings = getDefaultScreeningSettings();
      const updated = updateScreeningSettings(settings, { enabled: true });
      expect(updated.enabled).toBe(true);
    });
  });

  describe("getSenderStatusLabel", () => {
    it("returns correct labels", () => {
      expect(getSenderStatusLabel("pending")).toBe("Pending");
      expect(getSenderStatusLabel("allowed")).toBe("Allowed");
      expect(getSenderStatusLabel("blocked")).toBe("Blocked");
      expect(getSenderStatusLabel("feed")).toBe("Feed");
    });
  });

  describe("getSenderStatusColor", () => {
    it("returns correct colors", () => {
      expect(getSenderStatusColor("pending")).toBe("text-yellow-500");
      expect(getSenderStatusColor("allowed")).toBe("text-green-500");
      expect(getSenderStatusColor("blocked")).toBe("text-red-500");
      expect(getSenderStatusColor("feed")).toBe("text-blue-500");
    });
  });

  describe("shouldScreenEmail", () => {
    it("returns false when screening disabled", () => {
      const settings = getDefaultScreeningSettings();
      expect(shouldScreenEmail(undefined, settings)).toBe(false);
    });

    it("returns true for unknown sender when enabled", () => {
      const settings = getDefaultScreeningSettings();
      settings.enabled = true;
      expect(shouldScreenEmail(undefined, settings)).toBe(true);
    });

    it("returns true for pending sender", () => {
      const settings = getDefaultScreeningSettings();
      settings.enabled = true;
      expect(shouldScreenEmail(createSenderRecord("test@example.com"), settings)).toBe(true);
    });

    it("returns false for allowed sender", () => {
      const settings = getDefaultScreeningSettings();
      settings.enabled = true;
      const sender = allowSender(createSenderRecord("test@example.com"));
      expect(shouldScreenEmail(sender, settings)).toBe(false);
    });
  });

  describe("shouldBlockEmail", () => {
    it("returns false for undefined sender", () => {
      expect(shouldBlockEmail(undefined)).toBe(false);
    });

    it("returns true for blocked sender", () => {
      const sender = blockSender(createSenderRecord("test@example.com"));
      expect(shouldBlockEmail(sender)).toBe(true);
    });
  });

  describe("getPendingCount", () => {
    it("returns correct count", () => {
      const senders = [
        createSenderRecord("a@example.com"),
        createSenderRecord("b@example.com"),
        allowSender(createSenderRecord("c@example.com")),
      ];
      expect(getPendingCount(senders)).toBe(2);
    });
  });

  describe("sortPendingByDate", () => {
    it("sorts by first seen", () => {
      const senders = [
        { ...createSenderRecord("a@example.com"), firstSeen: "2026-09-10T12:00:00Z" },
        { ...createSenderRecord("b@example.com"), firstSeen: "2026-09-09T12:00:00Z" },
      ];
      const sorted = sortPendingByDate(senders);
      expect(sorted[0].email).toBe("b@example.com");
    });
  });

  describe("bulkApplyAction", () => {
    it("applies action to selected senders", () => {
      const senders = [
        createSenderRecord("a@example.com"),
        createSenderRecord("b@example.com"),
        createSenderRecord("c@example.com"),
      ];
      const result = bulkApplyAction(senders, [senders[0].id, senders[1].id], "allow");
      expect(result[0].status).toBe("allowed");
      expect(result[1].status).toBe("allowed");
      expect(result[2].status).toBe("pending");
    });
  });
});
