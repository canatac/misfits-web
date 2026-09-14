import { describe, expect, it } from "vitest";
import { escapeHtml, highlightTerms, getHighlightClasses, splitHighlightedSegments } from "../search-highlight";

describe("escapeHtml", () => {
  it("escapes & to &amp;", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes < to &lt;", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes > to &gt;", () => {
    expect(escapeHtml("1 > 0")).toBe("1 &gt; 0");
  });

  it("escapes \" to &quot;", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("escapes ' to &#39;", () => {
    expect(escapeHtml("'hi'")).toBe("&#39;hi&#39;");
  });

  it("handles multiple special chars", () => {
    expect(escapeHtml("<div>&")).toBe("&lt;div&gt;&amp;");
  });
});

describe("highlightTerms", () => {
  it("returns original text when query is empty", () => {
    expect(highlightTerms("hello world", "")).toBe("hello world");
  });

  it("returns original text when query is whitespace only", () => {
    expect(highlightTerms("hello", "   ")).toBe("hello");
  });

  it("wraps single match in <mark> tags", () => {
    const result = highlightTerms("hello world", "world");
    expect(result).toContain('<mark class="');
    expect(result).toContain(">world</mark>");
  });

  it("highlights multiple terms separately", () => {
    const result = highlightTerms("hello world foo bar", "world foo");
    expect(result).toContain(">world</mark>");
    expect(result).toContain(">foo</mark>");
  });

  it("matches case-insensitively", () => {
    const result = highlightTerms("Hello World", "hello");
    expect(result).toContain(">Hello</mark>");
  });

  it("escapes HTML in the source text before highlighting", () => {
    const result = highlightTerms("<b>bold</b>", "bold");
    expect(result).not.toContain("<b>");
    expect(result).toContain("&lt;b&gt;");
    expect(result).toContain(">bold</mark>");
  });

  it("uses brand color at 30% opacity", () => {
    const result = highlightTerms("test", "test");
    expect(result).toContain("bg-[#C49B66]/30");
  });

  it("handles query longer than text", () => {
    expect(highlightTerms("hi", "hello world")).toBe("hi");
  });

  it("does not create empty segments for duplicate terms", () => {
    const result = highlightTerms("hello world", "hello hello");
    const markCount = (result.match(/<mark/g) || []).length;
    expect(markCount).toBe(1);
  });

  it("sorts by longer term first to avoid partial matches", () => {
    const result = highlightTerms("foo bar foobar", "foobar foo");
    expect(result).toContain(">foobar</mark>");
  });
});

describe("getHighlightClasses", () => {
  it("returns the brand mark class string", () => {
    expect(getHighlightClasses()).toContain("bg-[#C49B66]/30");
    expect(getHighlightClasses()).toContain("rounded-sm");
  });
});

describe("splitHighlightedSegments", () => {
  it("returns single non-highlighted segment when no query", () => {
    const segments = splitHighlightedSegments("hello world", "");
    expect(segments).toEqual([{ text: "hello world", highlighted: false }]);
  });

  it("returns segments with correct highlighted flags", () => {
    const segments = splitHighlightedSegments("hello world foo", "world");
    expect(segments).toEqual([
      { text: "hello ", highlighted: false },
      { text: "world", highlighted: true },
      { text: " foo", highlighted: false },
    ]);
  });

  it("handles multiple terms", () => {
    const segments = splitHighlightedSegments("hello world foo bar", "world foo");
    expect(segments).toContainEqual({ text: "world", highlighted: true });
    expect(segments).toContainEqual({ text: "foo", highlighted: true });
  });

  it("is case-insensitive", () => {
    const segments = splitHighlightedSegments("Hello World", "hello");
    expect(segments).toContainEqual({ text: "Hello", highlighted: true });
  });
});
