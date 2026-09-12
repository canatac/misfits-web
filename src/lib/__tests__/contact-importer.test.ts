import { describe, expect, it } from "vitest";
import { parseCSVContacts, type ImportResult } from "@/lib/contact-importer";

const CSV = `email,firstName,lastName,phone,company
alice@example.com,Alice,Smith,555-0100,Acme
bob@example.com,Bob,Jones,,Globex
alice@example.com,Alice,Smith,,Acme
not-an-email,Oops,,,,`;

describe("contact-importer", () => {
  it("parses valid CSV rows", () => {
    const result: ImportResult = parseCSVContacts(CSV);
    expect(result.contacts).toHaveLength(2);
    expect(result.contacts[0]).toEqual({
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Smith",
      phone: "555-0100",
      company: "Acme",
    });
  });

  it("skips invalid emails", () => {
    const result = parseCSVContacts(CSV);
    expect(result.skipped).toBe(1);
  });

  it("deduplicates by email", () => {
    const result = parseCSVContacts(CSV);
    expect(result.duplicates).toBe(1);
  });

  it("handles missing optional columns", () => {
    const result = parseCSVContacts(CSV);
    expect(result.contacts[1].phone).toBeNull();
  });

  it("returns empty for header-only CSV", () => {
    const result = parseCSVContacts("email,firstName");
    expect(result.contacts).toHaveLength(0);
  });
});
