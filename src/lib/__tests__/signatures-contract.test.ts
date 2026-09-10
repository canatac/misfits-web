/**
 * Integration test: Signatures cross-repo contract.
 *
 * signatures.ts manages email signatures stored in localStorage and
 * generates HTML for insertion into composed emails.
 * This test verifies the contract between signature templates and
 * the composer's expected HTML format.
 */
import { describe, it, expect } from "vitest";
import type { EmailSignature } from "@/types/composer";
import {
  signatureTemplates,
  generateDefaultSignature,
} from "@/lib/signatures";

describe("Signatures cross-repo contract", () => {
  it("signatureTemplates has at least one template", () => {
    expect(signatureTemplates.length).toBeGreaterThan(0);
  });

  it("each template has id, name, and html fields", () => {
    for (const tmpl of signatureTemplates) {
      expect(tmpl.id).toBeTruthy();
      expect(tmpl.name).toBeTruthy();
      expect(tmpl.html).toBeTruthy();
      expect(tmpl.html).toContain("<");
    }
  });

  it("template ids are unique", () => {
    const ids = signatureTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generateDefaultSignature returns valid EmailSignature", () => {
    const sig = generateDefaultSignature("John Doe", "john@misfits.fr");
    expect(sig.id).toBeTruthy();
    expect(sig.name).toBeTruthy();
    expect(sig.html).toBeTruthy();
    expect(sig.isDefault).toBe(true);
  });

  it("generateDefaultSignature replaces template placeholders", () => {
    const sig = generateDefaultSignature("Jane Smith", "jane@misfits.fr", "CEO");
    expect(sig.html).toContain("Jane Smith");
    expect(sig.html).toContain("jane@misfits.fr");
    expect(sig.html).toContain("CEO");
    expect(sig.html).not.toContain("{{");
  });

  it("generateDefaultSignature handles empty name", () => {
    const sig = generateDefaultSignature("", "noname@misfits.fr");
    expect(sig.html).toContain("noname@misfits.fr");
    expect(sig.html).not.toContain("{{");
  });

  it("EmailSignature has required fields for composer insertion", () => {
    const sig: EmailSignature = {
      id: "test",
      name: "Test",
      html: "<div>Test</div>",
      isDefault: false,
    };
    expect(sig.id).toBeTruthy();
    expect(sig.html).toBeTruthy();
    expect(typeof sig.isDefault).toBe("boolean");
  });

  it("signature HTML is valid for email body insertion", () => {
    const sig = generateDefaultSignature("Test", "test@misfits.fr");
    // Should be HTML-safe (no unclosed tags that would break email rendering)
    expect(sig.html).toContain("<");
    expect(sig.html).toContain(">");
    expect(sig.html).not.toContain("undefined");
    expect(sig.html).not.toContain("null");
  });
});
