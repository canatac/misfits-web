/**
 * Unit tests for data export library (mbox, vCard, iCal).
 */
import { describe, it, expect } from "vitest";
import {
  emailToMbox,
  emailsToMbox,
  contactToVcard,
  contactsToVcard,
  calendarToIcal,
  generateExportFilename,
  escapeMbox,
  escapeVcard,
  escapeIcal,
} from "@/lib/data-export";
import type { Email } from "@/types/email";
import type { Contact } from "@/types/contact";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Sender", address: "sender@example.com" },
    to: [{ name: "Recipient", address: "recipient@example.com" }],
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

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    company: "Acme Corp",
    avatarColor: "#ff0000",
    contactFrequency: "weekly",
    tags: [],
    notes: "Important contact",
    createdAt: "2026-09-10T12:00:00Z",
    updatedAt: "2026-09-10T12:00:00Z",
    lastContactAt: null,
    ...overrides,
  };
}

describe("data-export", () => {
  describe("emailToMbox", () => {
    it("exports a single email to mbox format", () => {
      const email = makeEmail();
      const mbox = emailToMbox(email);
      expect(mbox).toContain("From: \"Sender\" <sender@example.com>");
      expect(mbox).toContain("To: \"Recipient\" <recipient@example.com>");
      expect(mbox).toContain("Subject: Test Subject");
      expect(mbox).toContain("MIME-Version: 1.0");
    });

    it("escapes 'From ' lines in body", () => {
      const email = makeEmail({ body: "From someone@example.com" });
      const mbox = emailToMbox(email);
      expect(mbox).toContain(">From someone@example.com");
    });

    it("includes Cc header when present", () => {
      const email = makeEmail({ cc: [{ name: "CC", address: "cc@example.com" }] });
      const mbox = emailToMbox(email);
      expect(mbox).toContain("Cc: \"CC\" <cc@example.com>");
    });
  });

  describe("emailsToMbox", () => {
    it("exports multiple emails to a single mbox", () => {
      const emails = [makeEmail(), makeEmail({ id: "e2", subject: "Second" })];
      const mbox = emailsToMbox(emails);
      expect(mbox).toContain("Subject: Test Subject");
      expect(mbox).toContain("Subject: Second");
    });
  });

  describe("contactToVcard", () => {
    it("exports a contact to vCard 4.0", () => {
      const contact = makeContact();
      const vcard = contactToVcard(contact);
      expect(vcard).toContain("BEGIN:VCARD");
      expect(vcard).toContain("VERSION:4.0");
      expect(vcard).toContain("FN:John Doe");
      expect(vcard).toContain("EMAIL:john@example.com");
      expect(vcard).toContain("TEL:+1234567890");
      expect(vcard).toContain("ORG:Acme Corp");
      expect(vcard).toContain("END:VCARD");
    });

    it("handles contact without optional fields", () => {
      const contact = makeContact({ phone: undefined, company: undefined });
      const vcard = contactToVcard(contact);
      expect(vcard).not.toContain("TEL:");
      expect(vcard).not.toContain("ORG:");
    });
  });

  describe("contactsToVcard", () => {
    it("exports multiple contacts", () => {
      const contacts = [makeContact(), makeContact({ id: "c2", name: "Jane" })];
      const vcard = contactsToVcard(contacts);
      expect(vcard).toContain("FN:John Doe");
      expect(vcard).toContain("FN:Jane");
    });
  });

  describe("calendarToIcal", () => {
    it("exports events to iCal format", () => {
      const ical = calendarToIcal([
        {
          id: "event-1",
          title: "Meeting",
          description: "Team sync",
          startDate: "2026-09-10T14:00:00Z",
          endDate: "2026-09-10T15:00:00Z",
          location: "Office",
        },
      ]);
      expect(ical).toContain("BEGIN:VCALENDAR");
      expect(ical).toContain("VERSION:2.0");
      expect(ical).toContain("BEGIN:VEVENT");
      expect(ical).toContain("SUMMARY:Meeting");
      expect(ical).toContain("DESCRIPTION:Team sync");
      expect(ical).toContain("LOCATION:Office");
      expect(ical).toContain("END:VEVENT");
      expect(ical).toContain("END:VCALENDAR");
    });
  });

  describe("generateExportFilename", () => {
    it("generates mbox filename", () => {
      const filename = generateExportFilename("mbox");
      expect(filename).toMatch(/^misfits-export-\d{4}-\d{2}-\d{2}\.mbox$/);
    });

    it("generates vcard filename", () => {
      const filename = generateExportFilename("vcard");
      expect(filename).toMatch(/^misfits-export-\d{4}-\d{2}-\d{2}\.vcf$/);
    });

    it("generates ical filename", () => {
      const filename = generateExportFilename("ical");
      expect(filename).toMatch(/^misfits-export-\d{4}-\d{2}-\d{2}\.ics$/);
    });
  });

  describe("escape helpers", () => {
    it("escapeMbox escapes 'From ' lines", () => {
      expect(escapeMbox("From test")).toBe(">From test");
    });

    it("escapeVcard escapes special chars", () => {
      expect(escapeVcard("a,b;c\\d")).toBe("a\\,b\\;c\\\\d");
    });

    it("escapeIcal escapes special chars", () => {
      expect(escapeIcal("a,b;c\\d")).toBe("a\\,b\\;c\\\\d");
    });
  });
});
