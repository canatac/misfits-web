/**
 * Unit tests for email scheduling calendar view.
 */
import { describe, it, expect } from "vitest";
import {
  createCalendarView,
  rescheduleEmail,
  getEventsForDate,
  getEventsByAccount,
  getEventCountForDate,
  hasEventsOnDate,
  getEventColor,
  sortEventsByTime,
  formatScheduledTime,
  formatCalendarHeader,
  getEmptyStateMessage,
  type ScheduledEmailEvent,
} from "@/lib/scheduling-calendar";

function makeEvent(id: string, date: string, accountId: string = "a1"): ScheduledEmailEvent {
  return {
    id,
    emailId: `e-${id}`,
    subject: `Test ${id}`,
    to: "test@example.com",
    scheduledAt: date,
    accountId,
    accountColor: "#ff0000",
    status: "pending",
  };
}

describe("scheduling-calendar", () => {
  describe("createCalendarView", () => {
    it("creates month view", () => {
      const events = [makeEvent("1", "2026-09-10T12:00:00Z")];
      const view = createCalendarView(events, "month", "2026-09-01T00:00:00Z");
      expect(view.view).toBe("month");
      expect(view.days.length).toBe(30);
    });

    it("creates week view", () => {
      const events = [makeEvent("1", "2026-09-10T12:00:00Z")];
      const view = createCalendarView(events, "week", "2026-09-10T00:00:00Z");
      expect(view.view).toBe("week");
      expect(view.days.length).toBe(7);
    });

    it("creates day view", () => {
      const events = [makeEvent("1", "2026-09-10T12:00:00Z")];
      const view = createCalendarView(events, "day", "2026-09-10T00:00:00Z");
      expect(view.view).toBe("day");
      expect(view.days.length).toBe(1);
    });
  });

  describe("rescheduleEmail", () => {
    it("reschedules email", () => {
      const events = [makeEvent("1", "2026-09-10T12:00:00Z")];
      const rescheduled = rescheduleEmail(events, "1", "2026-09-11T12:00:00Z");
      expect(rescheduled[0].scheduledAt).toBe("2026-09-11T12:00:00Z");
    });
  });

  describe("getEventsForDate", () => {
    it("returns events for date", () => {
      const events = [
        makeEvent("1", "2026-09-10T12:00:00Z"),
        makeEvent("2", "2026-09-11T12:00:00Z"),
      ];
      const result = getEventsForDate(events, "2026-09-10");
      expect(result).toHaveLength(1);
    });
  });

  describe("getEventsByAccount", () => {
    it("returns events for account", () => {
      const events = [
        makeEvent("1", "2026-09-10T12:00:00Z", "a1"),
        makeEvent("2", "2026-09-10T12:00:00Z", "a2"),
      ];
      const result = getEventsByAccount(events, "a1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getEventCountForDate", () => {
    it("returns correct count", () => {
      const events = [
        makeEvent("1", "2026-09-10T12:00:00Z"),
        makeEvent("2", "2026-09-10T15:00:00Z"),
        makeEvent("3", "2026-09-11T12:00:00Z"),
      ];
      expect(getEventCountForDate(events, "2026-09-10")).toBe(2);
    });
  });

  describe("hasEventsOnDate", () => {
    it("returns true when events exist", () => {
      const events = [makeEvent("1", "2026-09-10T12:00:00Z")];
      expect(hasEventsOnDate(events, "2026-09-10")).toBe(true);
    });

    it("returns false when no events", () => {
      const events: ScheduledEmailEvent[] = [];
      expect(hasEventsOnDate(events, "2026-09-10")).toBe(false);
    });
  });

  describe("getEventColor", () => {
    it("returns account color", () => {
      const event = makeEvent("1", "2026-09-10T12:00:00Z");
      expect(getEventColor(event)).toBe("#ff0000");
    });
  });

  describe("sortEventsByTime", () => {
    it("sorts by scheduled time", () => {
      const events = [
        makeEvent("1", "2026-09-11T12:00:00Z"),
        makeEvent("2", "2026-09-10T12:00:00Z"),
      ];
      const sorted = sortEventsByTime(events);
      expect(sorted[0].id).toBe("2");
      expect(sorted[1].id).toBe("1");
    });
  });

  describe("formatScheduledTime", () => {
    it("formats time for display", () => {
      const formatted = formatScheduledTime("2026-09-10T12:00:00Z");
      expect(formatted).toContain("Sep");
      expect(formatted).toContain("10");
    });
  });

  describe("formatCalendarHeader", () => {
    it("formats month header", () => {
      const header = formatCalendarHeader("2026-09-10T00:00:00Z", "month");
      expect(header).toContain("September");
      expect(header).toContain("2026");
    });

    it("formats day header", () => {
      const header = formatCalendarHeader("2026-09-10T00:00:00Z", "day");
      expect(header).toContain("September");
    });
  });

  describe("getEmptyStateMessage", () => {
    it("returns correct messages", () => {
      expect(getEmptyStateMessage("month")).toBe("No scheduled emails this month");
      expect(getEmptyStateMessage("week")).toBe("No scheduled emails this week");
      expect(getEmptyStateMessage("day")).toBe("No scheduled emails today");
    });
  });
});
