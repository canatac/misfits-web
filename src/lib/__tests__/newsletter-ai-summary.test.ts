import { describe, expect, it } from "vitest";
import type { NewsletterItem } from "@/types/newsletters";
import {
  buildNewsletterAISummaryInput,
  shouldTriggerAISummary,
} from "@/lib/newsletter-ai-summary";

function item(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  return {
    id: "n1",
    sourceId: "s1",
    title: "<strong>Breaking</strong> News",
    topic: "Tech",
    summary: "Summary with <em>HTML</em>",
    signal: 90,
    links: [{ name: "source", url: "https://example.com" }],
    createdAt: "2026-09-03T06:30:00.000Z",
    updatedAt: "2026-09-03T06:30:00.000Z",
    ...overrides,
  };
}

describe("newsletter-ai-summary", () => {
  it("strips HTML from titles and summaries", () => {
    const result = buildNewsletterAISummaryInput({
      items: [item(), item({ id: "n2", signal: 80, title: "Second" })],
    });
    expect(result.prompt).not.toContain("<strong>");
    expect(result.prompt).toContain("Breaking News");
  });

  it("sorts top 3 by signal descending", () => {
    const result = buildNewsletterAISummaryInput({
      items: [
        item({ id: "low", signal: 50 }),
        item({ id: "high", signal: 95 }),
        item({ id: "mid", signal: 70 }),
        item({ id: "top", signal: 100 }),
      ],
    });
    expect(result.prompt).toMatch(/Top 3.*100.*95.*70/s);
  });

  it("includes high-signal section for remaining items ≥80", () => {
    const result = buildNewsletterAISummaryInput({
      items: [
        item({ id: "t1", signal: 100 }),
        item({ id: "t2", signal: 90 }),
        item({ id: "t3", signal: 85 }),
        item({ id: "other", signal: 82 }),
        item({ id: "low", signal: 30 }),
      ],
    });
    expect(result.prompt).toContain("Other high-signal");
    expect(result.prompt).toContain("[82]");
  });

  it("uses French instructions when locale is fr", () => {
    const result = buildNewsletterAISummaryInput({
      items: [item()],
      locale: "fr",
    });
    expect(result.prompt).toContain("synthétiseur");
  });

  it("uses English instructions when locale is en", () => {
    const result = buildNewsletterAISummaryInput({
      items: [item()],
      locale: "en",
    });
    expect(result.prompt).toContain("summarizer");
  });

  it("returns maxTokens of 1024", () => {
    const result = buildNewsletterAISummaryInput({ items: [item()] });
    expect(result.maxTokens).toBe(1024);
  });

  it("shouldTriggerAISummary returns true when 3+ items ≥70", () => {
    expect(
      shouldTriggerAISummary([
        item({ signal: 75 }),
        item({ id: "a", signal: 80 }),
        item({ id: "b", signal: 70 }),
      ])
    ).toBe(true);
  });

  it("shouldTriggerAISummary returns false when fewer than 3 items ≥70", () => {
    expect(
      shouldTriggerAISummary([
        item({ signal: 75 }),
        item({ id: "a", signal: 80 }),
        item({ id: "b", signal: 30 }),
      ])
    ).toBe(false);
  });
});
