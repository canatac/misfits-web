import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UrlWarningBadge } from "../url-warning-badge";

describe("UrlWarningBadge", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<UrlWarningBadge suspiciousCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows singular label for 1 link", () => {
    render(<UrlWarningBadge suspiciousCount={1} />);
    expect(screen.getByText("1 suspicious link")).toBeTruthy();
  });

  it("shows plural label for multiple links", () => {
    render(<UrlWarningBadge suspiciousCount={3} />);
    expect(screen.getByText("3 suspicious links")).toBeTruthy();
  });

  it("has alert role and aria-label", () => {
    render(<UrlWarningBadge suspiciousCount={2} />);
    const badge = screen.getByTestId("url-warning-badge");
    expect(badge.getAttribute("role")).toBe("alert");
    expect(badge.getAttribute("aria-label")).toContain("2 suspicious links");
  });
});
