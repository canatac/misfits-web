/**
 * Unit tests for email-to-event extraction.
 */
import { describe, it, expect } from "vitest";
import {
  extractEventFromEmail,
  extractedEventToInput,
  emailContainsEvent,
  createEmailEventLink,
} from "@/lib/email-to-event";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Organizer", address: "org@example.com" },
    to: [{ name: "Me", address: "me@example.com" }],
    subject: "Meeting Tomorrow",
    preview: "Let's meet tomorrow at 2pm at the office",
    body: "<p>Let's meet tomorrow at 2pm at the office</p>",
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

describe("email-to-event", () => {
  describe("extractEventFromEmail", () => {
    it("extracts event with ISO date", () => {
      const email = makeEmail({
        subject: "Meeting on 2026-09-15",
        preview: "Meeting on 2026-09-15 at 2pm",
      });
      const event = extractEventFromEmail(email);
      expect(event).toBeDefined();
      expect(event?.title).toBe("Meeting on 2026-09-15");
      expect(event?.startDate).toContain("2026-09-15");
    });

    it("extracts event with written date", () => {
      const email = makeEmail({
        subject: "Lunch on Friday",
        preview: "Lunch on September 15, 2026 at noon",
      });
      const event = extractEventFromEmail(email);
      expect(event).toBeDefined();
    });

    it("returns null when no date found", () => {
      const email = makeEmail({
        subject: "Hello",
        preview: "Just saying hi",
      });
      const event = extractEventFromEmail(email);
      expect(event).toBeNull();
    });

    it("extracts location", () => {
      const email = makeEmail({
        subject: "Meeting",
        preview: "Meeting on 2026-09-15 at Office",
        body: "<p>Meeting on 2026-09-15 at Office</p>",
      });
      const event = extractEventFromEmail(email);
      expect(event?.location).toBe("Office");
    });

    it("detects meeting type", () => {
      const email = makeEmail({
        subject: "Team meeting on 2026-09-15",
        preview: "Team meeting on 2026-09-15 to discuss the project",
        body: "<p>Team meeting on 2026-09-15</p>",
      });
      const event = extractEventFromEmail(email);
      expect(event?.eventType).toBe("meeting");
    });

    it("detects deadline type", () => {
      const email = makeEmail({
        subject: "Submission due 2026-09-15",
        preview: "The deadline is 2026-09-15 for submission",
        body: "<p>The deadline is 2026-09-15 for submission</p>",
      });
      const event = extractEventFromEmail(email);
      expect(event?.eventType).toBe("deadline");
    });

    it("strips Re: prefix from title", () => {
      const email = makeEmail({
        subject: "Re: Meeting on 2026-09-15",
        preview: "Meeting on 2026-09-15",
      });
      const event = extractEventFromEmail(email);
      expect(event?.title).toBe("Meeting on 2026-09-15");
    });

    it("sets default 1-hour duration", () => {
      const email = makeEmail({
        subject: "Meeting 2026-09-15",
        preview: "Meeting on 2026-09-15 at 2pm",
      });
      const event = extractEventFromEmail(email);
      expect(event).toBeDefined();
      const start = new Date(event!.startDate).getTime();
      const end = new Date(event!.endDate).getTime();
      expect(end - start).toBe(60 * 60 * 1000); // 1 hour
    });
  });

  describe("extractedEventToInput", () => {
    it("converts extracted event to input format", () => {
      const email = makeEmail({
        preview: "Meeting on 2026-09-15 at 2pm",
        body: "<p>Meeting on 2026-09-15 at 2pm</p>",
      });
      const extracted = extractEventFromEmail(email);
      expect(extracted).toBeDefined();
      const input = extractedEventToInput(extracted!);
      expect(input.title).toBe(extracted!.title);
      expect(input.start).toBe(extracted!.startDate);
      expect(input.end).toBe(extracted!.endDate);
      expect(input.eventType).toBe(extracted!.eventType);
      expect(input.location).toBe(extracted!.location || undefined);
    });
  });

  describe("emailContainsEvent", () => {
    it("returns true for email with date", () => {
      const email = makeEmail({ preview: "Meeting on 2026-09-15" });
      expect(emailContainsEvent(email)).toBe(true);
    });

    it("returns false for email without date", () => {
      const email = makeEmail({ preview: "No date mentioned" });
      expect(emailContainsEvent(email)).toBe(false);
    });
  });

  describe("createEmailEventLink", () => {
    it("creates a link object", () => {
      const link = createEmailEventLink("e1", "evt-1");
      expect(link.emailId).toBe("e1");
      expect(link.eventId).toBe("evt-1");
      expect(link.createdAt).toBeDefined();
    });
  });
});
