import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResultsFooter } from "../sub-components";

describe("ResultsFooter", () => {
  it("shows count and latency", () => {
    render(<ResultsFooter count={12} elapsedMs={34} onSave={vi.fn()} />);

    expect(screen.getByText("12 résultats • 34 ms")).toBeTruthy();
  });
});
