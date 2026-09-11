/**
 * Email Normalization Contract Tests
 *
 * Cross-repo invariant: the frontend email-normalization decoder must
 * produce the same visible output as the backend IMAP subject parser
 * (reimagined-guide) so that subjects render identically in the UI
 * and in any email export.
 */

import { describe, it, expect } from "vitest";
import {
  decodeMimeHeaderValue,
  normalizeEmailRecord,
} from "@/lib/email-normalization";
import type { Email } from "@/types/email";

describe("email-normalization contract", () => {
  describe("decodeMimeHeaderValue", () => {
    it("returns plain ASCII unchanged", () => {
      expect(decodeMimeHeaderValue("Hello World")).toBe("Hello World");
    });

    it("returns empty string unchanged", () => {
      expect(decodeMimeHeaderValue("")).toBe("");
    });

    it("decodes RFC 2047 Q-encoded UTF-8 subject", () => {
      const encoded = "=?UTF-8?Q?Bonjour_=C3=A9l=C3=A8ve?=";
      expect(decodeMimeHeaderValue(encoded)).toBe("Bonjour élève");
    });

    it("decodes RFC 2047 B-encoded UTF-8 subject", () => {
      const encoded = "=?UTF-8?B?Qm9uam91ciDDqWzDqHZl?=";
      expect(decodeMimeHeaderValue(encoded)).toBe("Bonjour élève");
    });

    it("decodes RFC 2047 Q-encoded ISO-8859-1", () => {
      const encoded = "=?ISO-8859-1?Q?Bonjour=E8ve?=";
      expect(decodeMimeHeaderValue(encoded)).toBe("Bonjourève");
    });

    it("decodes RFC 2047 Q-encoded Windows-1252", () => {
      const encoded = "=?Windows-1252?Q?caf=E9?=";
      expect(decodeMimeHeaderValue(encoded)).toBe("café");
    });

    it("handles mixed encoded and plain text", () => {
      const mixed = "Re: =?UTF-8?Q?R=C3=A9ponse?=";
      expect(decodeMimeHeaderValue(mixed)).toBe("Re: Réponse");
    });

    it("handles multiple encoded words", () => {
      const multi = "=?UTF-8?Q?Bonjour?= =?UTF-8?Q?=C3=A9l=C3=A8ve?=";
      expect(decodeMimeHeaderValue(multi)).toBe("Bonjour élève");
    });

    it("returns original on invalid encoding (graceful fallback)", () => {
      const invalid = "=?INVALID?X?something?=";
      expect(decodeMimeHeaderValue(invalid)).toBe(invalid);
    });

    it("handles underscore as space in Q-encoding per RFC 2047", () => {
      const encoded = "=?UTF-8?Q?Hello_World?=";
      expect(decodeMimeHeaderValue(encoded)).toBe("Hello World");
    });

    it("handles empty encoded text", () => {
      const encoded = "=?UTF-8?Q??=";
      expect(decodeMimeHeaderValue(encoded)).toBe("");
    });

    it("handles base64 with whitespace (strips per RFC)", () => {
      const encoded = "=?UTF-8?B?Qm9u am91?=";
      expect(decodeMimeHeaderValue(encoded)).toBe("Bonou");
    });
  });

  describe("normalizeEmailRecord", () => {
    const baseEmail: Email = {
      id: "email-1",
      threadId: "thread-1",
      folder: "inbox",
      from: { name: "Sender", address: "sender@example.com" },
      to: [{ name: "Recipient", address: "recipient@misfits.fr" }],
      subject: "Test Subject",
      preview: "Test preview",
      body: "<p>Hello</p>",
      bodyType: "html",
      date: "2026-09-10T08:00:00Z",
      receivedAt: "2026-09-10T08:00:01Z",
      isRead: false,
      isStarred: false,
      isImportant: false,
      attachments: [],
      hasAttachments: false,
      labels: [],
      size: 1024,
      messageId: "<msg-1@example.com>",
    };

    it("decodes MIME-encoded subject", () => {
      const email: Email = {
        ...baseEmail,
        subject: "=?UTF-8?Q?Bonjour_=C3=A9l=C3=A8ve?=",
      };
      const result = normalizeEmailRecord(email);
      expect(result.subject).toBe("Bonjour élève");
    });

    it("preserves plain subject", () => {
      const result = normalizeEmailRecord(baseEmail);
      expect(result.subject).toBe("Test Subject");
    });

    it("sets hasAttachments true when attachments array is non-empty", () => {
      const email: Email = {
        ...baseEmail,
        attachments: [
          {
            id: "att-1",
            filename: "doc.pdf",
            contentType: "application/pdf",
            size: 1024,
            type: "pdf",
          },
        ],
      };
      const result = normalizeEmailRecord(email);
      expect(result.hasAttachments).toBe(true);
    });

    it("sets hasAttachments false when no attachments", () => {
      const result = normalizeEmailRecord(baseEmail);
      expect(result.hasAttachments).toBe(false);
    });

    it("preserves existing hasAttachments when true and no attachments", () => {
      const email: Email = {
        ...baseEmail,
        hasAttachments: true,
        attachments: [],
      };
      const result = normalizeEmailRecord(email);
      expect(result.hasAttachments).toBe(true);
    });

    it("handles null attachments array", () => {
      const email: Email = {
        ...baseEmail,
        attachments: null as unknown as Email["attachments"],
      };
      const result = normalizeEmailRecord(email);
      expect(result.attachments).toEqual([]);
      expect(result.hasAttachments).toBe(false);
    });

    it("handles empty subject", () => {
      const email: Email = {
        ...baseEmail,
        subject: "",
      };
      const result = normalizeEmailRecord(email);
      expect(result.subject).toBe("");
    });

    it("preserves all other fields unchanged", () => {
      const result = normalizeEmailRecord(baseEmail);
      expect(result.id).toBe(baseEmail.id);
      expect(result.threadId).toBe(baseEmail.threadId);
      expect(result.folder).toBe(baseEmail.folder);
      expect(result.from).toEqual(baseEmail.from);
      expect(result.to).toEqual(baseEmail.to);
      expect(result.body).toBe(baseEmail.body);
      expect(result.date).toBe(baseEmail.date);
      expect(result.isRead).toBe(baseEmail.isRead);
      expect(result.isStarred).toBe(baseEmail.isStarred);
    });
  });

  describe("cross-repo invariants", () => {
    it("decodes French accented subject identically to backend expectation", () => {
      const encoded = "=?UTF-8?Q?R=C3=A9union_d'=C3=A9quipe_au_caf=C3=A9?=";
      const decoded = decodeMimeHeaderValue(encoded);
      expect(decoded).toBe("Réunion d'équipe au café");
    });

    it("decodes German umlaut subject", () => {
      const encoded = "=?UTF-8?B?RMO8cmZ0ZSBadXNhbW1lbg==?=";
      const decoded = decodeMimeHeaderValue(encoded);
      expect(decoded).toBe("Dürfte Zusammen");
    });

    it("decodes Japanese subject (Base64 UTF-8)", () => {
      const encoded = "=?UTF-8?B?44Gq44G444Gv44KK?=";
      const decoded = decodeMimeHeaderValue(encoded);
      expect(decoded).toBe("こんにちは");
    });

    it("handles emoji in subject (Base64 UTF-8)", () => {
      const encoded = "=?UTF-8?B?8J+ZjiBCb25qb3Vy?=";
      const decoded = decodeMimeHeaderValue(encoded);
      expect(decoded).toBe("🌟 Bonjour");
    });
  });
});
