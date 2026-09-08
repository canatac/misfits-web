import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResultsFooter } from "../sub-components";

describe("ResultsFooter", () => {
  it("shows count and status text", () => {
    render(<ResultsFooter count={12} query="from:acme" onSave={vi.fn()} />);

    expect(screen.getByText("12 résultats")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "12 résultats pour « from:acme »"
    );
  });
});
