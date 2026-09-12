import { describe, expect, it } from "vitest";
import { applyHighlights, computeHighlights, escapeRegExp } from "@/lib/search-highlighting";

describe("search-highlighting", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegExp("a.b*c")).toBe("a\\.b\\*c");
  });

  it("computes highlight ranges for single token", () => {
    const result = computeHighlights("world", "hello world and world!");
    expect(result.matchCount).toBe(2);
    expect(result.ranges[0]).toEqual({ start: 6, end: 11 });
  });

  it("treats multiple tokens as AND", () => {
    const result = computeHighlights("foo bar", "foo bar baz foo");
    expect(result.matchCount).toBe(3); // foo×2 + bar×1
  });

  it("applies highlight tags", () => {
    const result = computeHighlights("world", "hello world");
    const html = applyHighlights(result.text, result.ranges);
    expect(html).toBe("hello <mark>world</mark>");
  });

  it("escapes html in highlighted text", () => {
    const result = computeHighlights("a", "<a>");
    const html = applyHighlights(result.text, result.ranges);
    expect(html).toContain("&lt;mark&gt;");
  });
});
