import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NewsletterItem } from "@/types/newsletters";
import { generateDailyNewsletterBusinessBrief } from "@/lib/daily-newsletter-business-brief";

function item(overrides: Partial<NewsletterItem> = {}): NewsletterItem {
  return {
    id: "n1",
    sourceId: "s1",
    title: "Acme sous pression réglementaire",
    topic: "RegTech",
    summary: "Une enquête formelle est ouverte, risque de sanctions et impact sur les contrats publics.",
    signal: 92,
    links: [{ name: "Source", url: "https://example.com/a" }],
    createdAt: "2026-09-03T06:30:00.000Z",
    updatedAt: "2026-09-03T06:30:00.000Z",
    ...overrides,
  };
}

describe("daily-newsletter-business-brief", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns AI brief when JSON is valid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  brief:
                    "Le risque réglementaire sur Acme peut retarder les cycles de vente B2G; prioriser un plan de mitigation juridique et un scénario commercial alternatif.",
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const out = await generateDailyNewsletterBusinessBrief({
      newsletters: [item()],
      locale: "fr",
    });

    expect(out.source).toBe("ai");
    expect(out.text).toContain("Acme");
    expect(out.text).not.toContain("synthèse");
  });

  it("falls back to rules brief when upstream fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));

    const out = await generateDailyNewsletterBusinessBrief({
      newsletters: [item()],
      locale: "fr",
    });

    expect(out.source).toBe("rules");
    expect(out.text).toContain("Acme sous pression réglementaire");
  });
});
