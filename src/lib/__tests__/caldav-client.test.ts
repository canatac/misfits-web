/**
 * Unit tests for CalDAV client utility.
 */
import { describe, it, expect } from "vitest";
import {
  createCalDAVAccount,
  validateCalDAVAccount,
  buildCalDAVUrl,
  generateEventUID,
  formatCalDAVDate,
  parseCalDAVDate,
  buildEventQuery,
  buildEventPUT,
  createCalDAVEvent,
  supportsMultiCalendar,
  getProviderName,
  CALDAV_PROVIDERS,
} from "@/lib/caldav-client";

describe("caldav-client", () => {
  describe("createCalDAVAccount", () => {
    it("creates account with all fields", () => {
      const account = createCalDAVAccount({
        name: "My CalDAV",
        url: "https://cloud.example.com",
        username: "user",
        password: "pass",
        provider: "nextcloud",
      });
      expect(account.id).toBeDefined();
      expect(account.name).toBe("My CalDAV");
      expect(account.provider).toBe("nextcloud");
    });
  });

  describe("validateCalDAVAccount", () => {
    it("validates correct account", () => {
      const result = validateCalDAVAccount(
        createCalDAVAccount({
          name: "Test",
          url: "https://example.com",
          username: "user",
          password: "pass",
          provider: "custom",
        })
      );
      expect(result.valid).toBe(true);
    });

    it("rejects empty URL", () => {
      const result = validateCalDAVAccount(
        createCalDAVAccount({
          name: "Test",
          url: "",
          username: "user",
          password: "pass",
          provider: "custom",
        })
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("URL is required");
    });

    it("rejects empty username", () => {
      const result = validateCalDAVAccount(
        createCalDAVAccount({
          name: "Test",
          url: "https://example.com",
          username: "",
          password: "pass",
          provider: "custom",
        })
      );
      expect(result.valid).toBe(false);
    });

    it("rejects empty password", () => {
      const result = validateCalDAVAccount(
        createCalDAVAccount({
          name: "Test",
          url: "https://example.com",
          username: "user",
          password: "",
          provider: "custom",
        })
      );
      expect(result.valid).toBe(false);
    });
  });

  describe("buildCalDAVUrl", () => {
    it("builds Nextcloud URL", () => {
      const account = createCalDAVAccount({
        name: "Test",
        url: "https://cloud.example.com",
        username: "user",
        password: "pass",
        provider: "nextcloud",
      });
      expect(buildCalDAVUrl(account)).toBe("https://cloud.example.com/remote.php/dav");
    });

    it("builds Fastmail URL", () => {
      const account = createCalDAVAccount({
        name: "Test",
        url: "https://fastmail.com",
        username: "user",
        password: "pass",
        provider: "fastmail",
      });
      expect(buildCalDAVUrl(account)).toBe("https://fastmail.com/dav");
    });
  });

  describe("generateEventUID", () => {
    it("generates unique UIDs", () => {
      const uid1 = generateEventUID();
      const uid2 = generateEventUID();
      expect(uid1).not.toBe(uid2);
    });

    it("includes domain", () => {
      const uid = generateEventUID();
      expect(uid).toContain("@misfits.ai");
    });
  });

  describe("formatCalDAVDate", () => {
    it("formats to CalDAV format", () => {
      const formatted = formatCalDAVDate("2026-09-10T12:00:00Z");
      expect(formatted).toMatch(/^\d{8}T\d{6}Z$/);
    });
  });

  describe("parseCalDAVDate", () => {
    it("parses ISO date", () => {
      const parsed = parseCalDAVDate("2026-09-10T12:00:00Z");
      expect(parsed).toContain("2026-09-10");
    });

    it("parses CalDAV format", () => {
      const parsed = parseCalDAVDate("20260910T120000Z");
      expect(parsed).toContain("2026-09-10");
    });
  });

  describe("buildEventQuery", () => {
    it("builds valid XML", () => {
      const xml = buildEventQuery("2026-09-01T00:00:00Z", "2026-09-30T23:59:59Z");
      expect(xml).toContain("calendar-query");
      expect(xml).toContain("time-range");
    });
  });

  describe("buildEventPUT", () => {
    it("builds valid iCal", () => {
      const event = createCalDAVEvent({
        summary: "Test Event",
        start: "2026-09-10T12:00:00Z",
        end: "2026-09-10T13:00:00Z",
      });
      const ical = buildEventPUT(event);
      expect(ical).toContain("BEGIN:VCALENDAR");
      expect(ical).toContain("BEGIN:VEVENT");
      expect(ical).toContain("SUMMARY:Test Event");
    });
  });

  describe("createCalDAVEvent", () => {
    it("creates event with all fields", () => {
      const event = createCalDAVEvent({
        summary: "Meeting",
        start: "2026-09-10T12:00:00Z",
        end: "2026-09-10T13:00:00Z",
        description: "Team meeting",
        location: "Office",
      });
      expect(event.uid).toBeDefined();
      expect(event.summary).toBe("Meeting");
      expect(event.description).toBe("Team meeting");
      expect(event.location).toBe("Office");
    });
  });

  describe("supportsMultiCalendar", () => {
    it("returns true for Nextcloud", () => {
      expect(supportsMultiCalendar("nextcloud")).toBe(true);
    });

    it("returns false for iCloud", () => {
      expect(supportsMultiCalendar("icloud")).toBe(false);
    });
  });

  describe("getProviderName", () => {
    it("returns correct names", () => {
      expect(getProviderName("nextcloud")).toBe("Nextcloud");
      expect(getProviderName("fastmail")).toBe("Fastmail");
    });
  });
});
