/**
 * Unit tests for BIMI parser and validator.
 */
import { describe, it, expect } from "vitest";
import {
  parseBimiRecord,
  parseBimiHeaders,
  generateBimiRecord,
  validateSvgLogo,
  getBimiDnsRecordName,
} from "@/lib/bimi";

describe("bimi", () => {
  describe("parseBimiRecord", () => {
    it("parses a valid BIMI DNS record", () => {
      const record = "v=BIMI1; l=https://example.com/logo.svg";
      const result = parseBimiRecord(record);
      expect(result.isValid).toBe(true);
      expect(result.logoUrl).toBe("https://example.com/logo.svg");
      expect(result.errors).toHaveLength(0);
    });

    it("parses a BIMI record with VMC", () => {
      const record = "v=BIMI1; l=https://example.com/logo.svg; a=https://example.com/vmc.pem";
      const result = parseBimiRecord(record);
      expect(result.isValid).toBe(true);
      expect(result.vmcUrl).toBe("https://example.com/vmc.pem");
    });

    it("rejects invalid BIMI record (missing v=BIMI1)", () => {
      const result = parseBimiRecord("l=https://example.com/logo.svg");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid BIMI record: must start with "v=BIMI1"');
    });

    it("rejects missing logo URL", () => {
      const result = parseBimiRecord("v=BIMI1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required "l=" (logo URL) field');
    });

    it("rejects non-HTTPS logo URL", () => {
      const result = parseBimiRecord("v=BIMI1; l=http://example.com/logo.svg");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Logo URL must use HTTPS");
    });

    it("rejects non-SVG logo URL", () => {
      const result = parseBimiRecord("v=BIMI1; l=https://example.com/logo.png");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Logo URL must point to an SVG file");
    });

    it("rejects invalid URL format", () => {
      const result = parseBimiRecord("v=BIMI1; l=not-a-url");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid logo URL format");
    });
  });

  describe("parseBimiHeaders", () => {
    it("parses BIMI-Location header", () => {
      const result = parseBimiHeaders({
        "bimi-location": "https://example.com/logo.svg",
      });
      expect(result.isValid).toBe(true);
      expect(result.logoUrl).toBe("https://example.com/logo.svg");
    });

    it("parses BIMI-Indicator header as VMC URL", () => {
      const result = parseBimiHeaders({
        "bimi-location": "https://example.com/logo.svg",
        "bimi-indicator": "https://example.com/vmc.pem",
      });
      expect(result.isValid).toBe(true);
      expect(result.vmcUrl).toBe("https://example.com/vmc.pem");
    });

    it("rejects non-HTTPS BIMI-Location", () => {
      const result = parseBimiHeaders({
        "bimi-location": "http://example.com/logo.svg",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("BIMI-Location must use HTTPS");
    });

    it("returns invalid when no BIMI headers present", () => {
      const result = parseBimiHeaders({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("No BIMI headers found");
    });
  });

  describe("generateBimiRecord", () => {
    it("generates a basic BIMI record", () => {
      const record = generateBimiRecord({ domain: "example.com" });
      expect(record).toBe("v=BIMI1; l=https://example.com/.well-known/bimi/logo.svg");
    });

    it("generates a BIMI record with VMC", () => {
      const record = generateBimiRecord({
        domain: "example.com",
        vmcPath: "/.well-known/bimi/vmc.pem",
      });
      expect(record).toContain("v=BIMI1");
      expect(record).toContain("l=https://example.com/.well-known/bimi/logo.svg");
      expect(record).toContain("a=https://example.com/.well-known/bimi/vmc.pem");
    });

    it("generates a record with custom logo path", () => {
      const record = generateBimiRecord({
        domain: "example.com",
        logoPath: "/custom/logo.svg",
      });
      expect(record).toBe("v=BIMI1; l=https://example.com/custom/logo.svg");
    });
  });

  describe("validateSvgLogo", () => {
    it("validates a clean SVG", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
      const result = validateSvgLogo(svg);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects SVG without svg element", () => {
      const result = validateSvgLogo('<circle xmlns="http://www.w3.org/2000/svg"/>');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing <svg> element");
    });

    it("rejects SVG without xmlns", () => {
      const result = validateSvgLogo("<svg><circle/></svg>");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing xmlns attribute");
    });

    it("rejects SVG with script tags", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
      const result = validateSvgLogo(svg);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SVG contains <script> tags");
    });

    it("rejects SVG with javascript: URLs", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)">x</a></svg>';
      const result = validateSvgLogo(svg);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SVG contains javascript: URLs");
    });

    it("rejects SVG with event handlers", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle onclick="alert(1)"/></svg>';
      const result = validateSvgLogo(svg);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SVG contains event handlers");
    });
  });

  describe("getBimiDnsRecordName", () => {
    it("returns the correct DNS record name", () => {
      expect(getBimiDnsRecordName("example.com")).toBe("default._bimi.example.com");
    });

    it("handles subdomains", () => {
      expect(getBimiDnsRecordName("mail.example.com")).toBe("default._bimi.mail.example.com");
    });
  });
});
