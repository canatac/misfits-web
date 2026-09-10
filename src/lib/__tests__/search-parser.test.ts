/**
 * Unit tests for search-parser.ts
 *
 * Covers: parseSize, parseDate, tokenize (via parseSearchQuery),
 * getActiveOperator, and the full parseSearchQuery pipeline.
 */
import { describe, it, expect } from "vitest";
import {
  parseSize,
  parseDate,
  parseSearchQuery,
  getActiveOperator,
} from "@/lib/search-parser";

describe("parseSize", () => {
  it("parses bytes (no unit)", () => {
    expect(parseSize("500")).toBe(500);
  });

  it("parses kilobytes (K)", () => {
    expect(parseSize("200k")).toBe(200 * 1024);
    expect(parseSize("200K")).toBe(200 * 1024);
  });

  it("parses megabytes (M)", () => {
    expect(parseSize("5m")).toBe(5 * 1024 * 1024);
    expect(parseSize("1.5M")).toBe(1.5 * 1024 * 1024);
  });

  it("parses gigabytes (G)", () => {
    expect(parseSize("2g")).toBe(2 * 1024 * 1024 * 1024);
  });

  it("parses terabytes (T)", () => {
    expect(parseSize("1t")).toBe(1024 * 1024 * 1024 * 1024);
  });

  it("returns 0 for unparseable strings", () => {
    expect(parseSize("abc")).toBe(0);
    expect(parseSize("")).toBe(0);
  });

  it('handles "bytes" suffix', () => {
    expect(parseSize("100bytes")).toBe(100);
    expect(parseSize("100Bytes")).toBe(100);
  });
});

describe("parseDate", () => {
  it("parses relative days (7d)", () => {
    const result = parseDate("7d");
    expect(result).toBeDefined();
    const d = new Date(result!);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
  });

  it("parses relative years (1y)", () => {
    const result = parseDate("1y");
    expect(result).toBeDefined();
    const d = new Date(result!);
    const now = new Date();
    const diffYears = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365);
    expect(diffYears).toBeCloseTo(1, 0);
  });

  it("parses YYYY-MM-DD", () => {
    const result = parseDate("2025-03-15");
    expect(result).toBeDefined();
    const d = new Date(result!);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2); // 0-indexed
    expect(d.getDate()).toBe(15);
  });

  it("parses YYYY/MM/DD", () => {
    const result = parseDate("2025/03/15");
    expect(result).toBeDefined();
    const d = new Date(result!);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });

  it("parses YYYY-MM", () => {
    const result = parseDate("2025-03");
    expect(result).toBeDefined();
    const d = new Date(result!);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(1);
  });

  it("parses YYYY only", () => {
    const result = parseDate("2025");
    expect(result).toBeDefined();
    const d = new Date(result!);
    expect(d.getFullYear()).toBe(2025);
  });

  it("returns undefined for empty string", () => {
    expect(parseDate("")).toBeUndefined();
  });

  it("returns undefined for garbage input", () => {
    expect(parseDate("not-a-date")).toBeUndefined();
  });
});

describe("parseSearchQuery — free text", () => {
  it("parses a single free-text term", () => {
    const result = parseSearchQuery("hello");
    expect(result.textTerms).toEqual(["hello"]);
    expect(result.filters).toEqual({});
  });

  it("parses multiple free-text terms", () => {
    const result = parseSearchQuery("hello world");
    expect(result.textTerms).toEqual(["hello", "world"]);
  });

  it("preserves the raw query", () => {
    const result = parseSearchQuery("test query");
    expect(result.raw).toBe("test query");
  });
});

describe("parseSearchQuery — operators", () => {
  it("parses from: operator", () => {
    const result = parseSearchQuery("from:alice@example.com");
    expect(result.filters.from).toBe("alice@example.com");
    expect(result.textTerms).toEqual([]);
  });

  it("parses to: operator", () => {
    const result = parseSearchQuery("to:bob@example.com");
    expect(result.filters.to).toBe("bob@example.com");
  });

  it("parses subject: operator", () => {
    const result = parseSearchQuery('subject:"Hello World"');
    expect(result.filters.subject).toBe("Hello World");
  });

  it("parses quoted values with double quotes", () => {
    const result = parseSearchQuery('from:"John Doe"');
    expect(result.filters.from).toBe("John Doe");
  });

  it("parses quoted values with single quotes", () => {
    const result = parseSearchQuery("subject:'Q3 Roadmap'");
    expect(result.filters.subject).toBe("Q3 Roadmap");
  });

  it("parses has:attachment operator", () => {
    const result = parseSearchQuery("has:attachment");
    expect(result.filters.hasAttachment).toBe(true);
  });

  it("parses has:attachments (plural) operator", () => {
    const result = parseSearchQuery("has:attachments");
    expect(result.filters.hasAttachment).toBe(true);
  });

  it("parses is:unread operator", () => {
    const result = parseSearchQuery("is:unread");
    expect(result.filters.isUnread).toBe(true);
  });

  it("parses is:read operator", () => {
    const result = parseSearchQuery("is:read");
    expect(result.filters.isRead).toBe(true);
  });

  it("parses is:starred operator", () => {
    const result = parseSearchQuery("is:starred");
    expect(result.filters.isStarred).toBe(true);
  });

  it("parses label: operator", () => {
    const result = parseSearchQuery("label:work");
    expect(result.filters.label).toBe("work");
  });

  it("parses filename: operator", () => {
    const result = parseSearchQuery("filename:report.pdf");
    expect(result.filters.filename).toBe("report.pdf");
  });

  it("parses larger: operator", () => {
    const result = parseSearchQuery("larger:5M");
    expect(result.filters.larger).toBe(5 * 1024 * 1024);
  });

  it("parses smaller: operator", () => {
    const result = parseSearchQuery("smaller:100K");
    expect(result.filters.smaller).toBe(100 * 1024);
  });

  it("parses before: operator", () => {
    const result = parseSearchQuery("before:2025-01-01");
    expect(result.filters.before).toBeDefined();
  });

  it("parses after: operator", () => {
    const result = parseSearchQuery("after:2025-01-01");
    expect(result.filters.after).toBeDefined();
  });
});

describe("parseSearchQuery — mixed operators and free text", () => {
  it("separates operators from free-text terms", () => {
    const result = parseSearchQuery("from:alice@example.com hello world");
    expect(result.filters.from).toBe("alice@example.com");
    expect(result.textTerms).toEqual(["hello", "world"]);
  });

  it("handles multiple operators", () => {
    const result = parseSearchQuery("from:alice@example.com subject:Meeting is:unread");
    expect(result.filters.from).toBe("alice@example.com");
    expect(result.filters.subject).toBe("Meeting");
    expect(result.filters.isUnread).toBe(true);
    expect(result.textTerms).toEqual([]);
  });

  it("ignores unknown operators (treats as free text)", () => {
    const result = parseSearchQuery("unknown:value");
    // Unknown operator falls through default case — value becomes free text
    expect(result.textTerms).toContain("unknown:value");
  });
});

describe("getActiveOperator", () => {
  it("detects active operator being typed", () => {
    const result = getActiveOperator("from:Sa", 7);
    expect(result).toEqual({ operator: "from", partial: "Sa" });
  });

  it("returns null when no operator is active", () => {
    const result = getActiveOperator("hello world", 11);
    expect(result).toBeNull();
  });

  it("detects operator at start of string", () => {
    const result = getActiveOperator("subject:Test", 12);
    expect(result).toEqual({ operator: "subject", partial: "Test" });
  });

  it("handles cursor in middle of operator value", () => {
    const result = getActiveOperator("from:alice@example.com", 8);
    expect(result).toEqual({ operator: "from", partial: "ali" });
  });

  it("handles quoted value with cursor inside", () => {
    const result = getActiveOperator('from:"John Doe"', 10);
    expect(result).toEqual({ operator: "from", partial: "John" });
  });

  it("returns null for empty string", () => {
    const result = getActiveOperator("", 0);
    expect(result).toBeNull();
  });
});
