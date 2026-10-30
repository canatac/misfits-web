import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhishingBanner } from "../phishing-banner";
import type { PhishingScanResult } from "@/lib/phishing-scanner";

describe("PhishingBanner", () => {
  it("renders nothing for safe emails", () => {
    const result: PhishingScanResult = { threatLevel: "safe", score: 0, indicators: [], scannedAt: new Date().toISOString() };
    const { container } = render(<PhishingBanner result={result} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows warning for high threat", () => {
    const result: PhishingScanResult = { threatLevel: "high", score: 80, indicators: [{ type: "domain", detail: "test", severity: "high" }], scannedAt: new Date().toISOString() };
    render(<PhishingBanner result={result} />);
    expect(screen.getByTestId("phishing-banner")).toBeTruthy();
    expect(screen.getByText(/phishing attempt/i)).toBeTruthy();
  });

  it("lists indicators", () => {
    const result: PhishingScanResult = { threatLevel: "medium", score: 50, indicators: [{ type: "url", detail: "Bad URL", severity: "medium" }], scannedAt: new Date().toISOString() };
    render(<PhishingBanner result={result} />);
    expect(screen.getByText(/Bad URL/)).toBeTruthy();
  });

  it("has alert role", () => {
    const result: PhishingScanResult = { threatLevel: "high", score: 80, indicators: [], scannedAt: new Date().toISOString() };
    render(<PhishingBanner result={result} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
