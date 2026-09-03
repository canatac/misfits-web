import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewsletterItem } from "@/types/newsletters";
import { suggestNewsFromDailyBrief } from "@/lib/daily-news-opportunities";

function item(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  return {
    id: "n1",
    sourceId: "s1",
    title: "ACME update",
    topic: "Finance",
    summary: "Résumé\n- point",
    signal: 88,
    links: [{ name: "Source", url: "https://example.com/a" }],
    createdAt: "2026-09-03T06:30:00.000Z",
    updatedAt: "2026-09-03T06:30:00.000Z",
    ...overrides,
  };
}

describe("daily-news-opportunities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns AI suggestions when JSON is valid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  items: [
                    {
                      title: "Acme lève 50M€",
                      url: "https://news.example.com/acme-fundraise",
                      reason: "Apport de capital significatif",
                      source: "Les Echos",
                      publishedAt: "2026-09-03T09:00:00Z",
                      category: "capital",
                    },
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const out = await suggestNewsFromDailyBrief({
      summaryText: "Veille & presse: 3 synthèses.",
      newsletters: [item()],
      locale: "fr",
    });

    expect(out.source).toBe("ai");
    expect(out.items).toHaveLength(1);
    expect(out.items[0]?.category).toBe("capital");
    expect(out.items[0]?.source).toBe("Les Echos");
    expect(out.items[0]?.publishedAt).toBe("2026-09-03T09:00:00.000Z");
  });

  it("falls back to none when upstream fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));

    const out = await suggestNewsFromDailyBrief({
      summaryText: "Veille & presse: 3 synthèses.",
      newsletters: [item()],
      locale: "fr",
    });

    expect(out.source).toBe("none");
    expect(out.items).toHaveLength(0);
  });
});
