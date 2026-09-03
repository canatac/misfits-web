import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryList } from "../summary-list";

describe("SummaryList", () => {
  it("renders modern structured summary and normalized sources", () => {
    render(
      <SummaryList
        sources={[
          {
            id: "src-1",
            name: "GitHub Blog",
            url: "https://github.blog",
            createdAt: "2026-09-01T00:00:00Z",
            updatedAt: "2026-09-01T00:00:00Z",
          },
        ]}
        items={[
          {
            id: "it-1",
            sourceId: "src-1",
            title: "GitHub Changelog",
            topic: "Tech",
            signal: 91,
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
            ],
            createdAt: "2026-09-01T00:00:00Z",
            updatedAt: "2026-09-03T00:00:00Z",
          },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "GitHub Changelog", level: 2 })
    ).toBeTruthy();
    expect(screen.getByText("Résumé")).toBeTruthy();
    expect(screen.getByText("Scan plus rapide")).toBeTruthy();
    expect(screen.getByText("Vérification PR durcie")).toBeTruthy();
    expect(screen.getByText("Sources")).toBeTruthy();

    const sourceLinks = screen.getAllByRole("link", {
      name: /GitHub Changelog|Billet officiel/i,
    });
    expect(sourceLinks.length).toBe(1);
  });

  it("renders empty state when no item is available", () => {
    render(<SummaryList items={[]} sources={[]} />);
    expect(screen.getByText(/Aucun résumé pour le moment/i)).toBeTruthy();
  });
});
