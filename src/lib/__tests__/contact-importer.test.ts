/**
 * Unit tests for contact importer.
 */
import { describe, it, expect } from "vitest";
import {
  extractContactsFromEmails,
  parseVCard,
  parseCSV,
  detectDuplicates,
  mergeDuplicates,
  createImportProgress,
  updateImportProgress,
  isValidImportEmail,
  filterValidContacts,
  getUniqueContacts,
  searchContacts,
} from "@/lib/contact-importer";

describe("contact-importer", () => {
  describe("extractContactsFromEmails", () => {
    it("extracts unique contacts", () => {
      const emails = [
        { from: { name: "John", address: "john@example.com" }, to: [{ name: "Me", address: "me@example.com" }] },
        { from: { name: "John", address: "john@example.com" }, to: [{ name: "Jane", address: "jane@example.com" }] },
      ];
      const contacts = extractContactsFromEmails(emails);
      expect(contacts).toHaveLength(3);
    });
  });

  describe("parseVCard", () => {
    it("parses vCard data", () => {
      const vcard = `BEGIN:VCARD
FN:John Doe
EMAIL:john@example.com
TEL:+1234567890
ORG:Acme
END:VCARD`;
      const contacts = parseVCard(vcard);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe("John Doe");
      expect(contacts[0].email).toBe("john@example.com");
    });
  });

  describe("parseCSV", () => {
    it("parses CSV data", () => {
      const csv = `name,email,phone
John,john@example.com,+1234567890
Jane,jane@example.com,+0987654321`;
      const contacts = parseCSV(csv);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].email).toBe("john@example.com");
    });
  });

  describe("detectDuplicates", () => {
    it("detects duplicate emails", () => {
      const existing = [{ name: "John", email: "john@example.com", source: "manual" as const, importedAt: "" }];
      const incoming = [{ name: "John D", email: "john@example.com", source: "csv" as const, importedAt: "" }];
      const duplicates = detectDuplicates(existing, incoming);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].matchField).toBe("email");
    });
  });

  describe("mergeDuplicates", () => {
    it("merges and removes duplicates", () => {
      const existing = [{ name: "John", email: "john@example.com", source: "manual" as const, importedAt: "" }];
      const incoming = [
        { name: "John", email: "john@example.com", source: "csv" as const, importedAt: "" },
        { name: "Jane", email: "jane@example.com", source: "csv" as const, importedAt: "" },
      ];
      const merged = mergeDuplicates(existing, incoming);
      expect(merged).toHaveLength(2);
    });
  });

  describe("createImportProgress", () => {
    it("creates progress tracker", () => {
      const progress = createImportProgress(100);
      expect(progress.total).toBe(100);
      expect(progress.status).toBe("pending");
    });
  });

  describe("updateImportProgress", () => {
    it("updates progress", () => {
      const progress = createImportProgress(100);
      const updated = updateImportProgress(progress, 50);
      expect(updated.processed).toBe(50);
      expect(updated.status).toBe("processing");
    });

    it("marks completed when done", () => {
      const progress = createImportProgress(100);
      const updated = updateImportProgress(progress, 100);
      expect(updated.status).toBe("completed");
    });
  });

  describe("isValidImportEmail", () => {
    it("validates correct email", () => {
      expect(isValidImportEmail("test@example.com")).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(isValidImportEmail("invalid")).toBe(false);
    });
  });

  describe("filterValidContacts", () => {
    it("filters invalid contacts", () => {
      const contacts = [
        { name: "Valid", email: "valid@example.com", source: "csv" as const, importedAt: "" },
        { name: "Invalid", email: "invalid", source: "csv" as const, importedAt: "" },
      ];
      const valid = filterValidContacts(contacts);
      expect(valid).toHaveLength(1);
    });
  });

  describe("getUniqueContacts", () => {
    it("returns unique contacts", () => {
      const contacts = [
        { name: "John", email: "john@example.com", source: "csv" as const, importedAt: "" },
        { name: "John2", email: "john@example.com", source: "vcard" as const, importedAt: "" },
      ];
      const unique = getUniqueContacts(contacts);
      expect(unique).toHaveLength(1);
    });
  });

  describe("searchContacts", () => {
    it("searches by name", () => {
      const contacts = [
        { name: "John Doe", email: "john@example.com", source: "csv" as const, importedAt: "" },
        { name: "Jane Doe", email: "jane@example.com", source: "csv" as const, importedAt: "" },
      ];
      const results = searchContacts(contacts, "john");
      expect(results).toHaveLength(1);
    });
  });
});
