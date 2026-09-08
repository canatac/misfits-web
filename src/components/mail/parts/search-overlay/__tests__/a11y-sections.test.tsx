import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecentSearches, ResultsFooter } from "../sub-components";

describe("Search overlay a11y sections", () => {
  it("exposes recents section as heading landmark", () => {
    render(
      <RecentSearches
        history={[
          { id: "h1", query: "from:acme", timestamp: "2026-09-08T00:00:00Z" },
        ]}
        onPick={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Récentes" })).toBeTruthy();
  });

  it("announces results count with aria-live status", () => {
    render(<ResultsFooter count={12} query="from:acme" onSave={vi.fn()} />);

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("12 résultats pour « from:acme »");
  });
});
