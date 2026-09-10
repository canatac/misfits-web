/**
 * Unit tests for email digest mode.
 */
import { describe, it, expect } from "vitest";
import {
  groupEmailsBySender,
  sortGroupsByRecent,
  toggleGroupCollapsed,
  collapseAllGroups,
  expandAllGroups,
  countTotalUnread,
  countTotalEmails,
  createDigestState,
  toggleDigest,
  markGroupAsRead,
  archiveGroup,
  isDigestEnabled,
  getDigestSummary,
  getEmptyStateMessage,
} from "@/lib/email-digest";

const SAMPLE_EMAILS = [
  { id: "e1", senderName: "John", senderEmail: "john@example.com", subject: "Hello", preview: "Hi there", timestamp: "2026-09-10T10:00:00Z", unread: true },
  { id: "e2", senderName: "John", senderEmail: "john@example.com", subject: "Update", preview: "Quick update", timestamp: "2026-09-10T11:00:00Z", unread: true },
  { id: "e3", senderName: "Jane", senderEmail: "jane@example.com", subject: "Meeting", preview: "Let's meet", timestamp: "2026-09-10T09:00:00Z", unread: false },
];

describe("email-digest", () => {
  describe("groupEmailsBySender", () => {
    it("groups emails by sender", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      expect(groups).toHaveLength(2);
    });
  });

  describe("sortGroupsByRecent", () => {
    it("sorts by latest timestamp", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      const sorted = sortGroupsByRecent(groups);
      expect(sorted[0].senderEmail).toBe("john@example.com");
    });
  });

  describe("toggleGroupCollapsed", () => {
    it("toggles collapsed state", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      const toggled = toggleGroupCollapsed(groups, groups[0].id);
      expect(toggled[0].collapsed).toBe(true);
    });
  });

  describe("collapseAllGroups", () => {
    it("collapses all groups", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      const collapsed = collapseAllGroups(groups);
      expect(collapsed.every((g) => g.collapsed)).toBe(true);
    });
  });

  describe("expandAllGroups", () => {
    it("expands all groups", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      const expanded = expandAllGroups(groups);
      expect(expanded.every((g) => !g.collapsed)).toBe(true);
    });
  });

  describe("countTotalUnread", () => {
    it("counts unread", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      expect(countTotalUnread(groups)).toBe(2);
    });
  });

  describe("countTotalEmails", () => {
    it("counts total", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      expect(countTotalEmails(groups)).toBe(3);
    });
  });

  describe("createDigestState", () => {
    it("creates state", () => {
      const state = createDigestState(SAMPLE_EMAILS);
      expect(state.enabled).toBe(true);
      expect(state.totalUnread).toBe(2);
      expect(state.totalEmails).toBe(3);
    });
  });

  describe("toggleDigest", () => {
    it("toggles mode", () => {
      const state = createDigestState(SAMPLE_EMAILS);
      const toggled = toggleDigest(state);
      expect(toggled.enabled).toBe(false);
    });
  });

  describe("markGroupAsRead", () => {
    it("marks group as read", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      const updated = markGroupAsRead(groups, groups[0].id);
      expect(updated[0].unreadCount).toBe(0);
    });
  });

  describe("archiveGroup", () => {
    it("archives group", () => {
      const groups = groupEmailsBySender(SAMPLE_EMAILS);
      const archived = archiveGroup(groups, groups[0].id);
      expect(archived).toHaveLength(1);
    });
  });

  describe("isDigestEnabled", () => {
    it("returns enabled", () => {
      const state = createDigestState(SAMPLE_EMAILS);
      expect(isDigestEnabled(state)).toBe(true);
    });
  });

  describe("getDigestSummary", () => {
    it("returns summary", () => {
      const state = createDigestState(SAMPLE_EMAILS);
      expect(getDigestSummary(state)).toBe("2 unread emails");
    });

    it("returns no unread", () => {
      const state = createDigestState([]);
      expect(getDigestSummary(state)).toBe("No unread emails");
    });
  });

  describe("getEmptyStateMessage", () => {
    it("returns message for empty", () => {
      const state = createDigestState([]);
      expect(getEmptyStateMessage(state)).toBe("No emails to show");
    });

    it("returns null when emails exist", () => {
      const state = createDigestState(SAMPLE_EMAILS);
      expect(getEmptyStateMessage(state)).toBeNull();
    });
  });
});
