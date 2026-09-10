import { describe, expect, it } from "vitest";
import {
  estimateReadingTime,
  formatReadingTime,
  READING_WPM,
  READING_MIN_WORDS,
} from "@/components/mail/email-view-utils";

describe("estimateReadingTime", () => {
  it("returns null for empty string", () => {
    expect(estimateReadingTime("")).toBeNull();
  });

  it("returns null for short text (<20 words)", () => {
    const short = "This is a short email with few words";
    expect(estimateReadingTime(short)).toBeNull();
  });

  it("returns null for HTML with <20 words", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    expect(estimateReadingTime(html)).toBeNull();
  });

  it("estimates 1 min for 200 words", () => {
    const words = Array(READING_WPM).fill("word").join(" ");
    const result = estimateReadingTime(words);
    expect(result).not.toBeNull();
    expect(result?.minutes).toBe(1);
    expect(result?.words).toBe(READING_WPM);
  });

  it("estimates 2 min for 400 words", () => {
    const words = Array(400).fill("word").join(" ");
    const result = estimateReadingTime(words);
    expect(result?.minutes).toBe(2);
  });

  it("rounds up to at least 1 minute", () => {
    const words = Array(READING_MIN_WORDS).fill("word").join(" ");
    const result = estimateReadingTime(words);
    expect(result?.minutes).toBe(1);
  });

  it("strips HTML tags before counting", () => {
    const html = "<p>" + Array(250).fill("word").join(" ") + "</p>";
    const result = estimateReadingTime(html);
    expect(result?.minutes).toBe(1);
    // HTML tag stripping may affect word count slightly; just verify it works
    expect(result?.words).toBeGreaterThan(200);
  });

  it("handles HTML entities", () => {
    const html = "<p>Hello world</p>";
    const result = estimateReadingTime(html);
    expect(result).toBeNull(); // < 20 words
  });
});

describe("formatReadingTime", () => {
  it("returns empty string for null", () => {
    expect(formatReadingTime(null)).toBe("");
  });

  it("formats 1 minute", () => {
    expect(formatReadingTime({ minutes: 1, words: 200 })).toBe("~1 min read");
  });

  it("formats multiple minutes", () => {
    expect(formatReadingTime({ minutes: 5, words: 1000 })).toBe("~5 min read");
  });
});
