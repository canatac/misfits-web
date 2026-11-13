import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhishingWarningBadge } from "../phishing-warning-badge";

describe("PhishingWarningBadge", () => {
  it("renders nothing for safe threat level", () => {
    const { container } = render(<PhishingWarningBadge threatLevel="safe" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for low threat level", () => {
    const { container } = render(<PhishingWarningBadge threatLevel="low" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows 'Suspicious' for medium", () => {
    render(<PhishingWarningBadge threatLevel="medium" />);
    expect(screen.getByText("Suspicious")).toBeTruthy();
  });

  it("shows 'Suspect' for high", () => {
    render(<PhishingWarningBadge threatLevel="high" />);
    expect(screen.getByText("Suspect")).toBeTruthy();
  });

  it("has alert role", () => {
    render(<PhishingWarningBadge threatLevel="high" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
