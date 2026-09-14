import { describe, expect, it } from "vitest";
import { FindInPage, findAllInText } from "@/lib/email-find-in-page";

describe("email-find-in-page", () => {
  it("finds all occurrences (case-insensitive)", () => {
    const matches = findAllInText("Hello hello HELLO", "hello");
    expect(matches).toHaveLength(3);
    expect(matches[0].text).toBe("Hello");
  });

  it("supports case-sensitive search", () => {
    const matches = findAllInText("Hello hello", "hello", { caseSensitive: true });
    expect(matches).toHaveLength(1);
  });

  it("returns empty for empty query", () => {
    expect(findAllInText("text", "")).toEqual([]);
  });

  it("FindInPage navigates next and prev", () => {
    const finder = new FindInPage();
    const result = finder.search("a b a", "a");
    expect(result.total).toBe(2);
    expect(result.currentIndex).toBe(0);
    finder.next();
    expect(finder.next().currentIndex).toBe(0); // wraps around
    expect(finder.prev().currentIndex).toBe(1); // wraps backward
  });

  it("clear resets state", () => {
    const finder = new FindInPage();
    finder.search("hello world", "hello");
    finder.clear();
    expect(finder.next().total).toBe(0);
  });
});
