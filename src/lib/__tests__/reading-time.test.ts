/**
 * Unit tests for reading time.
 */
import { describe, it, expect } from "vitest";
import {
  stripHtml,
  countWords,
  calculateReadingTime,
  getReadingTimeLabel,
  shouldShowReadingTime,
  getWordCount,
} from "@/lib/reading-time";

describe("reading-time", () => {
  describe("stripHtml", () => {
    it("strips HTML tags", () => {
      expect(stripHtml("<p>Hello world</p>")).toBe("Hello world");
    });

    it("handles nested tags", () => {
      expect(stripHtml("<div><p>Hello <strong>world</strong></p></div>")).toBe("Hello world");
    });

    it("handles plain text", () => {
      expect(stripHtml("Hello world")).toBe("Hello world");
    });
  });

  describe("countWords", () => {
    it("counts words", () => {
      expect(countWords("Hello world")).toBe(2);
    });

    it("handles multiple spaces", () => {
      expect(countWords("Hello   world")).toBe(2);
    });

    it("handles HTML", () => {
      expect(countWords("<p>Hello world</p>")).toBe(2);
    });

    it("handles empty string", () => {
      expect(countWords("")).toBe(0);
    });
  });

  describe("calculateReadingTime", () => {
    it("calculates reading time", () => {
      const text = "word ".repeat(400);
      expect(calculateReadingTime(text)).toBe(2);
    });

    it("returns 1 min for short text", () => {
      const text = "word ".repeat(50);
      expect(calculateReadingTime(text)).toBe(1);
    });
  });

  describe("getReadingTimeLabel", () => {
    it("returns empty for short text", () => {
      expect(getReadingTimeLabel("Hello world")).toBe("");
    });

    it("returns minutes for medium text", () => {
      const text = "word ".repeat(100);
      expect(getReadingTimeLabel(text)).toContain("min read");
    });

    it("returns 'Long read' for long text", () => {
      const text = "word ".repeat(300);
      expect(getReadingTimeLabel(text)).toBe("Long read");
    });
  });

  describe("shouldShowReadingTime", () => {
    it("returns false for short text", () => {
      expect(shouldShowReadingTime("Hello world")).toBe(false);
    });

    it("returns true for longer text", () => {
      const text = "word ".repeat(30);
      expect(shouldShowReadingTime(text)).toBe(true);
    });
  });

  describe("getWordCount", () => {
    it("returns word count", () => {
      expect(getWordCount("Hello world")).toBe(2);
    });
  });
});
