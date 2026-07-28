import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateDomain,
  checkExternalRecipient,
  checkAttachmentMention,
  validateRecipient,
  getDomain,
} from "@/lib/email-validation";

describe("validateEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(validateEmail("user@misfits.ai")).toBe(true);
    expect(validateEmail("john.doe+tag@example.co.uk")).toBe(true);
  });
  it("rejects malformed addresses", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("a".repeat(255) + "@x.com")).toBe(false);
  });
});

describe("validateDomain", () => {
  it("accepts domains with a valid TLD", () => {
    expect(validateDomain("user@misfits.ai")).toBe(true);
    expect(validateDomain("user@example.co.uk")).toBe(true);
  });
  it("rejects single-label and localhost domains", () => {
    expect(validateDomain("user@localhost")).toBe(false);
    expect(validateDomain("user@domain")).toBe(false);
    expect(validateDomain("user@x.x")).toBe(false); // TLD too short (<2 chars)
    expect(validateDomain("user@x.co")).toBe(true);
  });
});

describe("getDomain", () => {
  it("extracts the domain", () => {
    expect(getDomain("User@Example.COM")).toBe("example.com");
    expect(getDomain("bad")).toBeNull();
  });
});

describe("checkExternalRecipient", () => {
  it("flags external domains", () => {
    expect(checkExternalRecipient("user@gmail.com")).toBe(true);
    expect(checkExternalRecipient("user@sub.misfits.ai")).toBe(false);
    expect(checkExternalRecipient("user@misfits.ai")).toBe(false);
  });
});

describe("validateRecipient", () => {
  it("returns a combined result", () => {
    const r = validateRecipient("user@gmail.com");
    expect(r.valid).toBe(true);
    expect(r.domainOk).toBe(true);
    expect(r.external).toBe(true);
    expect(r.reason).toBeUndefined();
  });
  it("includes a reason when invalid", () => {
    const r = validateRecipient("nope");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("Invalid email format");
  });
});

describe("checkAttachmentMention", () => {
  it("detects attachment keywords in HTML", () => {
    expect(checkAttachmentMention("<p>Please find <strong>attached</strong> the report.</p>")).toBe(true);
    expect(checkAttachmentMention("I've attached the invoice.")).toBe(true);
  });
  it("returns false when no keywords", () => {
    expect(checkAttachmentMention("<p>Hello there.</p>")).toBe(false);
    expect(checkAttachmentMention("")).toBe(false);
  });
});
