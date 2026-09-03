import { describe, expect, it } from "vitest";
import type { NewsletterItem } from "@/types/newsletters";
import {
  getNext0600GmtPlusOneRefresh,
  summarizeDailyNewsletters,
} from "@/lib/daily-newsletter-summary";

function item(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  return {
    id: "n1",
    sourceId: "s1",
    title: "GitHub Changelog",
    topic: "Tech",
    summary: "Résumé\n- point 1",
    signal: 90,
    links: [{ name: "source", url: "https://example.com" }],
    createdAt: "2026-09-03T06:30:00.000Z",
    updatedAt: "2026-09-03T06:30:00.000Z",
    ...overrides,
  };
}

describe("daily-newsletter-summary", () => {
  it("returns empty message when there are no newsletters", () => {
    const out = summarizeDailyNewsletters([], new Date("2026-09-03T07:00:00.000Z"), "fr");
    expect(out.text).toContain("aucun résumé disponible");
    expect(out.windowStartIso).toBe("2026-09-03T05:00:00.000Z");
  });

  it("computes counts since 06:00 GMT+1 window", () => {
    const now = new Date("2026-09-03T10:00:00.000Z"); // 11:00 GMT+1
    const out = summarizeDailyNewsletters(
      [
        item({ id: "new", updatedAt: "2026-09-03T05:10:00.000Z", signal: 95, title: "Breaking" }),
        item({ id: "old", updatedAt: "2026-09-03T04:59:59.000Z", signal: 70, title: "Older" }),
      ],
      now,
      "fr"
    );

    expect(out.text).toContain("2 synthèse(s)");
    expect(out.text).toContain("1 nouvelle(s) depuis 06:00 GMT+1");
    expect(out.text).toContain("1 à fort signal");
    expect(out.text).toContain("Point prioritaire: Breaking");
    expect(out.windowStartIso).toBe("2026-09-03T05:00:00.000Z");
  });

  it("computes next refresh at 06:00 GMT+1 next day", () => {
    const next = getNext0600GmtPlusOneRefresh(new Date("2026-09-03T10:00:00.000Z"));
    expect(next.toISOString()).toBe("2026-09-04T05:00:00.000Z");
  });

  it("uses previous day 06:00 window before current 06:00 GMT+1", () => {
    const out = summarizeDailyNewsletters(
      [item({ updatedAt: "2026-09-02T12:00:00.000Z", signal: 85 })],
      new Date("2026-09-03T04:30:00.000Z"), // 05:30 GMT+1, still previous window
      "fr"
    );
    expect(out.windowStartIso).toBe("2026-09-02T05:00:00.000Z");
  });
});
