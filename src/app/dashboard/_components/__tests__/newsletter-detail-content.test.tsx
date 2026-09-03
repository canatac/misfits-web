import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewsletterDetailContent } from "../newsletter-detail-content";

describe("NewsletterDetailContent", () => {
  it("formats digest body and normalizes/deduplicates sources", () => {
    render(
      <NewsletterDetailContent
        item={{
          id: "nl-1",
          title: "GitHub Changelog",
          signal: 91,
          tags: ["#tech"],
          topic: "Tech",
          summary: [
            "## Résumé",
            "GitHub annonce plusieurs améliorations orientées sécurité.",
            "- Scan plus rapide",
            "- Vérification PR durcie",
            "Sources:",
            "- Billet officiel: https://github.blog/changelog",
          ].join("\n"),
          links: [
            { name: "GitHub Changelog", url: "https://github.blog/changelog" },
            { name: "Duplicate", url: "https://github.blog/changelog" },
          ],
          createdAt: "2026-09-01T00:00:00Z",
          updatedAt: "2026-09-03T00:00:00Z",
        }}
      />
    );

    expect(
      screen.getByRole("heading", { name: "GitHub Changelog", level: 2 })
    ).toBeTruthy();
    expect(screen.getByText("Résumé")).toBeTruthy();
    expect(screen.getByText("Scan plus rapide")).toBeTruthy();
    expect(screen.getByText("Vérification PR durcie")).toBeTruthy();
    expect(screen.getByText("Sources")).toBeTruthy();
    expect(screen.getByText(/Signal 91%/i)).toBeTruthy();

    const sourceLinks = screen.getAllByRole("link", {
      name: /GitHub Changelog|Billet officiel/i,
    });
    expect(sourceLinks.length).toBe(1);
  });
});
