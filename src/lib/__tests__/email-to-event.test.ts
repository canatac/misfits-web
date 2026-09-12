import { describe, it, expect } from "vitest";
import {
  detectEventType,
  extractISODates,
  extractHumanDates,
  extractEventTitle,
  buildEventFromEmail,
} from "@/lib/email-to-event";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    to: [{ name: "Me", address: "me@misfits.ai" }],
    subject: "Subject",
    preview: "Preview",
    body: "Hello world",
    bodyType: "text",
    date: "2026-01-15T09:00:00Z",
    receivedAt: "2026-01-15T09:00:00Z",
    isRead: true,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 100,
    messageId: "<msg1@example.com>",
    ...overrides,
  };
}

describe("detectEventType", () => {
  it("detects meeting from subject", () => {
    expect(detectEventType("Meeting about Q1 goals", "")).toBe("meeting");
  });

  it("detects meeting from Zoom mention in body", () => {
    expect(detectEventType("Call", "Join via zoom.us/j/123")).toBe("meeting");
  });

  it("detects deadline", () => {
    expect(detectEventType("Project deadline", "Due by Friday")).toBe("deadline");
  });

  it("detects travel", () => {
    expect(detectEventType("Trip to Paris", "Flight booked")).toBe("travel");
  });

  it("returns default for generic emails", () => {
    expect(detectEventType("Hello", "How are you?")).toBe("default");
  });

  it("detects catch-up", () => {
    expect(detectEventType("Let\'s catch up", "")).toBe("meeting");
  });
});

describe("extractISODates", () => {
  it("extracts ISO dates", () => {
    const text = "Meeting on 2026-03-15 and ends 2026-03-16T17:00";
    const dates = extractISODates(text);
    expect(dates).toContain("2026-03-15");
    expect(dates).toContain("2026-03-16T17:00");
  });

  it("returns empty for no dates", () => {
    expect(extractISODates("No dates here")).toEqual([]);
  });

  it("extracts datetime with seconds", () => {
    const dates = extractISODates("Start: 2026-01-01T09:00:00");
    expect(dates).toContain("2026-01-01T09:00:00");
  });
});

describe("extractHumanDates", () => {
  it("extracts 'January 15, 2026' format", () => {
    const dates = extractHumanDates("Meeting on January 15, 2026");
    expect(dates).toContain("2026-01-15");
  });

  it("extracts '15 January' format", () => {
    const dates = extractHumanDates("Due 15 January 2026");
    expect(dates).toContain("2026-01-15");
  });

  it("extracts 'Jan 5' abbreviation", () => {
    const dates = extractHumanDates("Call on Jan 5");
    expect(dates.some((d) => d.endsWith("-01-05"))).toBe(true);
  });

  it("returns empty for no dates", () => {
    expect(extractHumanDates("No date mentioned")).toEqual([]);
  });
});

describe("extractEventTitle", () => {
  it("strips Re: prefix", () => {
    const email = makeEmail({ subject: "Re: Project kickoff" });
    expect(extractEventTitle(email)).toBe("Project kickoff");
  });

  it("strips Fwd: prefix", () => {
    const email = makeEmail({ subject: "Fwd: Important update" });
    expect(extractEventTitle(email)).toBe("Important update");
  });

  it("strips multiple prefixes", () => {
    const email = makeEmail({ subject: "Re: Re: Fwd: Meeting" });
    expect(extractEventTitle(email)).toBe("Meeting");
  });

  it("returns title when no prefix", () => {
    const email = makeEmail({ subject: "Regular subject" });
    expect(extractEventTitle(email)).toBe("Regular subject");
  });

  it("handles empty subject", () => {
    const email = makeEmail({ subject: "" });
    expect(extractEventTitle(email)).toBe("Untitled Event");
  });
});

describe("buildEventFromEmail", () => {
  it("builds event from ISO dates", () => {
    const email = makeEmail({
      subject: "Team sync",
      body: "Meeting on 2026-04-10T14:00 to 2026-04-10T15:00",
      preview: "Quarterly sync",
    });
    const event = buildEventFromEmail(email);
    expect(event).not.toBeNull();
    expect(event!.title).toBe("Team sync");
    expect(event!.eventType).toBe("meeting");
    expect(event!.start).toBe("2026-04-10T14:00");
    expect(event!.end).toBe("2026-04-10T15:00");
  });

  it("builds event from human-readable dates", () => {
    const email = makeEmail({
      subject: "Project deadline",
      body: "Deadline is March 20, 2026",
    });
    const event = buildEventFromEmail(email);
    expect(event).not.toBeNull();
    expect(event!.eventType).toBe("deadline");
    expect(event!.start).toBe("2026-03-20");
  });

  it("returns null when no date found", () => {
    const email = makeEmail({
      subject: "Hello",
      body: "Just saying hi",
    });
    expect(buildEventFromEmail(email)).toBeNull();
  });

  it("uses single date when only one found", () => {
    const email = makeEmail({
      subject: "Reminder",
      body: "Reminder for 2026-06-01T09:00",
    });
    const event = buildEventFromEmail(email);
    expect(event).not.toBeNull();
    expect(event!.start).toBe("2026-06-01T09:00");
    expect(event!.end).toBe("2026-06-01T09:00");
  });

  it("cleans subject for title", () => {
    const email = makeEmail({
      subject: "Re: Re: Budget review",
      body: "On 2026-05-01",
    });
    const event = buildEventFromEmail(email);
    expect(event!.title).toBe("Budget review");
  });
});
