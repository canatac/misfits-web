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
 * Signatures Contract Tests
 *
 * Verifies the email signature management contract:
 * - Default signature generation from user identity
 * - Signature template substitution
 * - localStorage persistence contract
 * - CRUD lifecycle invariants
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateDefaultSignature,
  signatureTemplates,
  getSignatures,
  saveSignatures,
  getActiveSignatureId,
  setActiveSignatureId,
  getActiveSignature,
  upsertSignature,
  deleteSignature,
  type SignatureTemplate,
} from "@/lib/signatures";
import type { EmailSignature } from "@/types/composer";

// localStorage mock setup
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get store() {
      return store;
    },
  };
};

describe("signatures contract", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe("signatureTemplates", () => {
    it("contains at least one template", () => {
      expect(signatureTemplates.length).toBeGreaterThan(0);
    });

    it("every template has id, name, and html fields", () => {
      for (const tmpl of signatureTemplates) {
        expect(typeof tmpl.id).toBe("string");
        expect(tmpl.id.length).toBeGreaterThan(0);
        expect(typeof tmpl.name).toBe("string");
        expect(tmpl.name.length).toBeGreaterThan(0);
        expect(typeof tmpl.html).toBe("string");
        expect(tmpl.html.length).toBeGreaterThan(0);
      }
    });

    it("default template html contains substitution placeholders", () => {
      const def = signatureTemplates[0];
      expect(def.html).toContain("{{name}}");
      expect(def.html).toContain("{{email}}");
    });
  });

  describe("generateDefaultSignature", () => {
    it("substitutes name and email into the template", () => {
      const sig = generateDefaultSignature("Jean Atac", "jean@misfits.fr");
      expect(sig.html).toContain("Jean Atac");
      expect(sig.html).toContain("jean@misfits.fr");
      expect(sig.html).not.toContain("{{name}}");
      expect(sig.html).not.toContain("{{email}}");
    });

    it("uses email prefix as display name when name is empty", () => {
      const sig = generateDefaultSignature("", "jean@misfits.fr");
      expect(sig.html).toContain("jean");
      expect(sig.html).not.toContain("{{name}}");
    });

    it("falls back to 'me' when both name and email are empty", () => {
      const sig = generateDefaultSignature("", "");
      // email.split("@")[0] is "" so falls through to "me"
      expect(sig.html).toContain("me");
    });

    it("returns isDefault: true", () => {
      const sig = generateDefaultSignature("Test", "test@test.fr");
      expect(sig.isDefault).toBe(true);
    });

    it("returns id matching the first template id", () => {
      const sig = generateDefaultSignature("Test", "test@test.fr");
      expect(sig.id).toBe(signatureTemplates[0].id);
    });

    it("substitutes title when provided", () => {
      const sig = generateDefaultSignature("Test", "test@test.fr", "Founder");
      expect(sig.html).toContain("Founder");
      expect(sig.html).not.toContain("{{title}}");
    });

    it("handles special characters in name", () => {
      const sig = generateDefaultSignature("Jean-François", "jf@misfits.fr");
      expect(sig.html).toContain("Jean-François");
    });
  });

  describe("getSignatures", () => {
    it("returns empty array when no signatures stored", () => {
      expect(getSignatures()).toEqual([]);
    });

    it("returns parsed signatures from localStorage", () => {
      const sigs: EmailSignature[] = [
        {
          id: "sig-1",
          name: "Test",
          html: "<div>Test</div>",
          isDefault: false,
        },
      ];
      localStorageMock.setItem("misfits:signatures", JSON.stringify(sigs));
      expect(getSignatures()).toEqual(sigs);
    });

    it("returns empty array on parse error", () => {
      localStorageMock.setItem("misfits:signatures", "not valid json");
      expect(getSignatures()).toEqual([]);
    });
  });

  describe("saveSignatures", () => {
    it("persists signatures as JSON string", () => {
      const sigs: EmailSignature[] = [
        {
          id: "sig-1",
          name: "Work",
          html: "<div>Work</div>",
          isDefault: true,
        },
      ];
      saveSignatures(sigs);
      const stored = localStorageMock.getItem("misfits:signatures");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(sigs);
    });
  });

  describe("getActiveSignatureId", () => {
    it("returns null when no active id stored", () => {
      expect(getActiveSignatureId()).toBeNull();
    });

    it("returns stored active id", () => {
      setActiveSignatureId("sig-custom");
      expect(getActiveSignatureId()).toBe("sig-custom");
    });
  });

  describe("getActiveSignature", () => {
    it("returns generated default when no signatures exist", () => {
      const sig = getActiveSignature("Jean", "jean@misfits.fr");
      expect(sig.isDefault).toBe(true);
      expect(sig.html).toContain("Jean");
    });

    it("returns matching active signature when found", () => {
      const custom: EmailSignature = {
        id: "sig-custom",
        name: "Custom",
        html: "<div>Custom HTML</div>",
        isDefault: false,
      };
      saveSignatures([custom]);
      setActiveSignatureId("sig-custom");
      const sig = getActiveSignature("Jean", "jean@misfits.fr");
      expect(sig.id).toBe("sig-custom");
      expect(sig.html).toContain("Custom HTML");
    });

    it("falls back to first default signature when active not found", () => {
      const def: EmailSignature = {
        id: "sig-def",
        name: "Default",
        html: "<div>Default HTML</div>",
        isDefault: true,
      };
      saveSignatures([def]);
      setActiveSignatureId("sig-nonexistent");
      const sig = getActiveSignature("Jean", "jean@misfits.fr");
      expect(sig.id).toBe("sig-def");
    });
  });

  describe("upsertSignature", () => {
    it("adds new signature to empty list", () => {
      const sig: EmailSignature = {
        id: "sig-new",
        name: "New",
        html: "<div>New</div>",
        isDefault: false,
      };
      const result = upsertSignature(sig);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(sig);
    });

    it("updates existing signature by id", () => {
      const sig: EmailSignature = {
        id: "sig-1",
        name: "Original",
        html: "<div>Original</div>",
        isDefault: false,
      };
      upsertSignature(sig);

      const updated: EmailSignature = {
        ...sig,
        name: "Updated",
        html: "<div>Updated</div>",
      };
      const result = upsertSignature(updated);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Updated");
      expect(result[0].html).toContain("Updated");
    });

    it("appends new signature when id does not exist", () => {
      const sig1: EmailSignature = {
        id: "sig-1",
        name: "First",
        html: "<div>First</div>",
        isDefault: false,
      };
      const sig2: EmailSignature = {
        id: "sig-2",
        name: "Second",
        html: "<div>Second</div>",
        isDefault: false,
      };
      upsertSignature(sig1);
      const result = upsertSignature(sig2);
      expect(result).toHaveLength(2);
    });
  });

  describe("deleteSignature", () => {
    it("removes signature by id", () => {
      const sig1: EmailSignature = {
        id: "sig-1",
        name: "One",
        html: "<div>One</div>",
        isDefault: false,
      };
      const sig2: EmailSignature = {
        id: "sig-2",
        name: "Two",
        html: "<div>Two</div>",
        isDefault: false,
      };
      upsertSignature(sig1);
      upsertSignature(sig2);

      const result = deleteSignature("sig-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sig-2");
    });

    it("returns empty array when all deleted", () => {
      const sig: EmailSignature = {
        id: "sig-only",
        name: "Only",
        html: "<div>Only</div>",
        isDefault: false,
      };
      upsertSignature(sig);
      const result = deleteSignature("sig-only");
      expect(result).toEqual([]);
    });
  });

  describe("round-trip contract", () => {
    it("full lifecycle: create, activate, read back", () => {
      const sig: EmailSignature = {
        id: "sig-roundtrip",
        name: "Round Trip",
        html: "<div>Round Trip HTML</div>",
        isDefault: false,
      };

      // Create
      upsertSignature(sig);
      expect(getSignatures()).toHaveLength(1);

      // Activate
      setActiveSignatureId("sig-roundtrip");
      expect(getActiveSignatureId()).toBe("sig-roundtrip");

      // Read back
      const active = getActiveSignature("Any", "any@misfits.fr");
      expect(active.id).toBe("sig-roundtrip");
      expect(active.html).toContain("Round Trip HTML");
    });
  });
});
