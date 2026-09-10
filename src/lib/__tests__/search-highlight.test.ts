/**
 * Unit tests for search result highlighting.
 */
import { describe, it, expect } from "vitest";
import {
  escapeRegExp,
  splitByMatches,
  highlightText,
  highlightMultipleTerms,
  containsSearchTerm,
  countMatches,
  parseSearchTerms,
} from "@/lib/search-highlight";

describe("search-highlight", () => {
  describe("escapeRegExp", () => {
    it("escapes special regex characters", () => {
      expect(escapeRegExp("a.b")).toBe("a\\.b");
      expect(escapeRegExp("test*")).toBe("test\\*");
      expect(escapeRegExp("a+b")).toBe("a\\+b");
    });

    it("returns text as-is when no special chars", () => {
      expect(escapeRegExp("test")).toBe("test");
    });
  });

  describe("splitByMatches", () => {
    it("returns single part when no match", () => {
      const parts = splitByMatches("hello world", "xyz");
      expect(parts).toHaveLength(1);
      expect(parts[0]).toEqual({ text: "hello world", matched: false });
    });

    it("splits text by matches", () => {
      const parts = splitByMatches("hello world hello", "hello");
      expect(parts.length).toBeGreaterThan(1);
      expect(parts.filter((p) => p.matched)).toHaveLength(2);
    });
  });

  describe("highlightText", () => {
    it("returns original text when no term", () => {
      const result = highlightText("hello world", "");
      expect(result).toBe("hello world");
    });

    it("wraps matched term in mark", () => {
      const result = highlightText("hello world hello", "hello");
      expect(result).toContain("<mark");
      expect(result).toContain("</mark>");
    });

    it("is case-insensitive", () => {
      const result = highlightText("Hello World", "hello");
      expect(result).toContain("<mark");
    });
  });

  describe("highlightMultipleTerms", () => {
    it("returns original text when no terms", () => {
      const result = highlightText("hello world", "");
      expect(result).toBe("hello world");
    });

    it("highlights all terms", () => {
      const result = highlightMultipleTerms("hello world foo bar", ["hello", "foo"]);
      expect(result).toContain("<mark");
    });
  });

  describe("containsSearchTerm", () => {
    it("returns true when contains term", () => {
      expect(containsSearchTerm("hello world", "world")).toBe(true);
    });

    it("returns false when not contains", () => {
      expect(containsSearchTerm("hello world", "xyz")).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(containsSearchTerm("Hello World", "hello")).toBe(true);
    });
  });

  describe("countMatches", () => {
    it("returns 0 when no matches", () => {
      expect(countMatches("hello world", "xyz")).toBe(0);
    });

    it("counts single match", () => {
      expect(countMatches("hello world", "hello")).toBe(1);
    });

    it("counts multiple matches", () => {
      expect(countMatches("hello hello world", "hello")).toBe(2);
    });
  });

  describe("parseSearchTerms", () => {
    it("returns empty array for empty query", () => {
      expect(parseSearchTerms("")).toEqual([]);
    });

    it("splits terms by whitespace", () => {
      expect(parseSearchTerms("hello world foo")).toEqual(["hello", "world", "foo"]);
    });

    it("filters empty terms", () => {
      expect(parseSearchTerms("  hello   world  ")).toEqual(["hello", "world"]);
    });
  });
});
