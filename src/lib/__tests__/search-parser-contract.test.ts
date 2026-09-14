/**
 * Integration test: Search parser cross-repo contract.
 *
 * search-parser.ts converts raw query strings into structured SearchQuery
 * objects for backend search endpoints. This test verifies the parsing
 * contract matches backend expectations.
 */
import { describe, it, expect } from "vitest";
import { parseSize, parseDate } from "@/lib/search-parser";

describe("Search parser cross-repo contract", () => {
  describe("parseSize", () => {
    it("parses bytes (no unit)", () => {
      expect(parseSize("100")).toBe(100);
      expect(parseSize("0")).toBe(0);
    });

    it("parses kilobytes", () => {
      expect(parseSize("5K")).toBe(5 * 1024);
      expect(parseSize("200k")).toBe(200 * 1024);
    });

    it("parses megabytes", () => {
      expect(parseSize("5M")).toBe(5 * 1024 * 1024);
      expect(parseSize("1.5m")).toBe(1.5 * 1024 * 1024);
    });

    it("parses gigabytes", () => {
      expect(parseSize("1G")).toBe(1024 * 1024 * 1024);
    });

    it("returns 0 for unparseable input", () => {
      expect(parseSize("abc")).toBe(0);
      expect(parseSize("")).toBe(0);
    });
  });

  describe("parseDate", () => {
    it("parses relative days", () => {
      const result = parseDate("7d");
      expect(result).toBeTruthy();
      expect(new Date(result!).getTime()).toBeLessThan(Date.now());
    });

    it("parses relative years", () => {
      const result = parseDate("1y");
      expect(result).toBeTruthy();
    });

    it("parses YYYY-MM-DD format", () => {
      const result = parseDate("2026-01-15");
      expect(result).toBe(new Date(2026, 0, 15).toISOString());
    });

    it("parses YYYY/MM/DD format", () => {
      const result = parseDate("2026/01/15");
      expect(result).toBe(new Date(2026, 0, 15).toISOString());
    });

    it("returns undefined for empty input", () => {
      expect(parseDate("")).toBeUndefined();
      expect(parseDate("   ")).toBeUndefined();
    });

    it("returns ISO string format", () => {
      const result = parseDate("2026-06-01");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
