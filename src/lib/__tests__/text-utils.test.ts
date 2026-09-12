import { describe, expect, it } from "vitest";
import { stripHtml, normalize, levenshtein, matchTerm } from "../search-engine/text-utils";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("decodes HTML entities", () => {
    expect(stripHtml("&lt;div&gt;")).toBe("<div>");
    expect(stripHtml("&amp;")).toBe("&");
    expect(stripHtml("&quot;x&quot;")).toBe('"x"');
    expect(stripHtml("&#39;x&#39;")).toBe("'x'");
  });

  it("replaces nbsp with space", () => {
    expect(stripHtml("a&nbsp;b")).toBe("a b");
  });

  it("collapses whitespace", () => {
    expect(stripHtml("  a    b  ")).toBe("a b");
  });

  it("removes script blocks", () => {
    const html = '<script>alert("xss")</script>Hello';
    expect(stripHtml(html)).toBe("Hello");
  });

  it("removes style blocks", () => {
    const html = '<style>.x { color: red; }</style>Content';
    expect(stripHtml(html)).toBe("Content");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });
});

describe("normalize", () => {
  it("lowercases text", () => {
    expect(normalize("Hello World")).toBe("hello world");
  });

  it("collapses whitespace", () => {
    expect(normalize("a   b   c")).toBe("a b c");
  });

  it("trims surrounding whitespace", () => {
    expect(normalize("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(normalize("")).toBe("");
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("abc", "abc", 5)).toBe(0);
  });

  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting", 10)).toBe(3);
  });

  it("returns maxDist+1 when difference exceeds bound", () => {
    expect(levenshtein("a", "abcde", 2)).toBe(3);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc", 5)).toBe(3);
    expect(levenshtein("abc", "", 5)).toBe(3);
  });

  it("bounded: rejects distance > maxDist", () => {
    expect(levenshtein("abc", "xyz", 2)).toBe(3);
  });
});

describe("matchTerm", () => {
  it("returns index of exact match", () => {
    expect(matchTerm("hello world", "world")).toBe(6);
  });

  it("returns -1 when no match", () => {
    expect(matchTerm("hello world", "xyz")).toBe(-1);
  });

  it("returns -1 for empty term", () => {
    expect(matchTerm("hello world", "")).toBe(-1);
  });

  it("fuzzy matches short terms with 1 edit distance", () => {
    const idx = matchTerm("hello world", "helo");
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  it("does not fuzzy match long terms", () => {
    expect(matchTerm("hello world", "helooo")).toBe(-1);
  });
});
