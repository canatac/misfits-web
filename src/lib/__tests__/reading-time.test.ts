import { describe, it, expect } from "vitest";
import {
  DEFAULT_READING_OPTIONS,
  calculateReadingTime,
  countWords,
  getReadingTimeFromHtml,
  getReadingTimeFromText,
  stripHtml,
} from "@/lib/reading-time";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello world</p>")).toBe("Hello world");
  });
  it("decodes HTML entities", () => {
    expect(stripHtml("&amp; &lt; &gt;")).toBe("& < >");
  });
});

describe("countWords", () => {
  it("counts words correctly", () => {
    expect(countWords("Hello world")).toBe(2);
  });
  it("handles empty string", () => {
    expect(countWords("")).toBe(0);
  });
});

describe("calculateReadingTime", () => {
  it("calculates minutes from word count", () => {
    expect(calculateReadingTime(200).minutes).toBe(1);
  });
  it("rounds up minutes", () => {
    expect(calculateReadingTime(201).minutes).toBe(2);
  });
  it("marks long reads", () => {
    const result = calculateReadingTime(1200);
    expect(result.isLongRead).toBe(true);
    expect(result.label).toContain("Long read");
  });
});

describe("getReadingTimeFromHtml", () => {
  it("returns null for short content", () => {
    expect(getReadingTimeFromHtml("<p>Short</p>")).toBeNull();
  });
  it("returns reading time for long content", () => {
    const longText = "word ".repeat(100);
    const result = getReadingTimeFromHtml(`<p>${longText}</p>`);
    expect(result).not.toBeNull();
  });
});

describe("DEFAULT_READING_OPTIONS", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_READING_OPTIONS.wpm).toBe(200);
  });
});
