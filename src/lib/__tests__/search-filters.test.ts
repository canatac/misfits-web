/**
 * Unit tests for search filter utilities.
 */
import { describe, it, expect } from "vitest";
import {
  getDateRangeStart,
  getDateRangeEnd,
  filterByDateRange,
  filterBySender,
  filterByAttachments,
  filterByReadStatus,
  filterByStarred,
  filterByFolder,
  applyFilters,
  getDateRangeLabel,
  getDateRangeOptions,
  computeFilterFacets,
} from "@/lib/search-filters";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "John Doe", address: "john@example.com" },
    to: [{ name: "Me", address: "me@example.com" }],
    subject: "Test Subject",
    preview: "Test preview",
    body: "<p>Test body</p>",
    bodyType: "html",
    date: "2026-09-10T12:00:00Z",
    receivedAt: "2026-09-10T12:00:00Z",
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 1024,
    messageId: "<test@example.com>",
    ...overrides,
  };
}

describe("search-filters", () => {
  describe("getDateRangeStart", () => {
    it("returns start of today", () => {
      const start = getDateRangeStart("today");
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });

    it("returns start of week", () => {
      const start = getDateRangeStart("week");
      expect(start.getDay()).toBe(0); // Sunday
    });

    it("returns start of month", () => {
      const start = getDateRangeStart("month");
      expect(start.getDate()).toBe(1);
    });
  });

  describe("filterByDateRange", () => {
    it("filters emails from today", () => {
      const emails = [
        makeEmail({ id: "e1", date: new Date().toISOString() }),
        makeEmail({ id: "e2", date: "2026-08-01T12:00:00Z" }),
      ];
      const result = filterByDateRange(emails, "today");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });

    it("filters emails from this month", () => {
      const now = new Date();
      const emails = [
        makeEmail({ id: "e1", date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString() }),
        makeEmail({ id: "e2", date: "2025-01-01T12:00:00Z" }),
      ];
      const result = filterByDateRange(emails, "month");
      expect(result).toHaveLength(1);
    });
  });

  describe("filterBySender", () => {
    it("filters by sender email", () => {
      const emails = [
        makeEmail({ id: "e1", from: { name: "John", address: "john@example.com" } }),
        makeEmail({ id: "e2", from: { name: "Jane", address: "jane@example.com" } }),
      ];
      const result = filterBySender(emails, "john");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });

    it("filters by sender name", () => {
      const emails = [
        makeEmail({ id: "e1", from: { name: "John Doe", address: "john@example.com" } }),
        makeEmail({ id: "e2", from: { name: "Jane Doe", address: "jane@example.com" } }),
      ];
      const result = filterBySender(emails, "Jane");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e2");
    });

    it("is case insensitive", () => {
      const emails = [makeEmail({ from: { name: "John", address: "john@example.com" } })];
      const result = filterBySender(emails, "JOHN");
      expect(result).toHaveLength(1);
    });
  });

  describe("filterByAttachments", () => {
    it("filters emails with attachments", () => {
      const emails = [
        makeEmail({ id: "e1", hasAttachments: true }),
        makeEmail({ id: "e2", hasAttachments: false }),
      ];
      const result = filterByAttachments(emails, true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });

    it("filters emails without attachments", () => {
      const emails = [
        makeEmail({ id: "e1", hasAttachments: true }),
        makeEmail({ id: "e2", hasAttachments: false }),
      ];
      const result = filterByAttachments(emails, false);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e2");
    });
  });

  describe("filterByReadStatus", () => {
    it("filters read emails", () => {
      const emails = [
        makeEmail({ id: "e1", isRead: true }),
        makeEmail({ id: "e2", isRead: false }),
      ];
      const result = filterByReadStatus(emails, true);
      expect(result).toHaveLength(1);
    });

    it("filters unread emails", () => {
      const emails = [
        makeEmail({ id: "e1", isRead: true }),
        makeEmail({ id: "e2", isRead: false }),
      ];
      const result = filterByReadStatus(emails, false);
      expect(result).toHaveLength(1);
    });
  });

  describe("filterByStarred", () => {
    it("filters starred emails", () => {
      const emails = [
        makeEmail({ id: "e1", isStarred: true }),
        makeEmail({ id: "e2", isStarred: false }),
      ];
      const result = filterByStarred(emails, true);
      expect(result).toHaveLength(1);
    });
  });

  describe("filterByFolder", () => {
    it("filters by folder", () => {
      const emails = [
        makeEmail({ id: "e1", folder: "inbox" }),
        makeEmail({ id: "e2", folder: "sent" }),
      ];
      const result = filterByFolder(emails, "inbox");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });
  });

  describe("applyFilters", () => {
    it("applies multiple filters with AND logic", () => {
      const emails = [
        makeEmail({ id: "e1", hasAttachments: true, isRead: false }),
        makeEmail({ id: "e2", hasAttachments: true, isRead: true }),
        makeEmail({ id: "e3", hasAttachments: false, isRead: false }),
      ];
      const result = applyFilters(emails, {
        hasAttachments: true,
        isRead: false,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });

    it("returns all emails when no filters", () => {
      const emails = [makeEmail(), makeEmail()];
      const result = applyFilters(emails, {});
      expect(result).toHaveLength(2);
    });

    it("combines sender and attachment filters", () => {
      const emails = [
        makeEmail({ id: "e1", from: { name: "John", address: "john@example.com" }, hasAttachments: true }),
        makeEmail({ id: "e2", from: { name: "John", address: "john@example.com" }, hasAttachments: false }),
        makeEmail({ id: "e3", from: { name: "Jane", address: "jane@example.com" }, hasAttachments: true }),
      ];
      const result = applyFilters(emails, {
        sender: "john",
        hasAttachments: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });
  });

  describe("getDateRangeLabel", () => {
    it("returns correct labels", () => {
      expect(getDateRangeLabel("today")).toBe("Today");
      expect(getDateRangeLabel("week")).toBe("This Week");
      expect(getDateRangeLabel("month")).toBe("This Month");
      expect(getDateRangeLabel("year")).toBe("This Year");
      expect(getDateRangeLabel("custom")).toBe("Custom Range");
    });
  });

  describe("getDateRangeOptions", () => {
    it("returns all options", () => {
      const options = getDateRangeOptions();
      expect(options).toHaveLength(5);
      expect(options[0].value).toBe("today");
    });
  });

  describe("computeFilterFacets", () => {
    it("computes facets correctly", () => {
      const emails = [
        makeEmail({ id: "e1", hasAttachments: true, isRead: false, isStarred: true, folder: "inbox" }),
        makeEmail({ id: "e2", hasAttachments: false, isRead: true, isStarred: false, folder: "inbox" }),
        makeEmail({ id: "e3", hasAttachments: true, isRead: false, isStarred: false, folder: "sent" }),
      ];
      const facets = computeFilterFacets(emails);
      expect(facets.total).toBe(3);
      expect(facets.withAttachments).toBe(2);
      expect(facets.unread).toBe(2);
      expect(facets.starred).toBe(1);
      expect(facets.byFolder.inbox).toBe(2);
      expect(facets.byFolder.sent).toBe(1);
    });
  });
});
