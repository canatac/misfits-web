import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UrlSafeLink } from "../url-safe-link";

describe("UrlSafeLink", () => {
  it("renders children for safe URLs", () => {
    render(<UrlSafeLink href="https://google.com">Safe link</UrlSafeLink>);
    expect(screen.getByText("Safe link")).toBeTruthy();
  });

  it("shows warning icon for suspicious URLs", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    expect(screen.getByLabelText("Suspicious link")).toBeTruthy();
  });

  it("opens the warning page on click for suspicious URL", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    fireEvent.click(screen.getByText("Bad link"));
    expect(screen.getByTestId("url-warning-page")).toBeTruthy();
    expect(screen.getByText(/suspicious link warning/i)).toBeTruthy();
  });

  it("offers to proceed anyway on the warning page", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    fireEvent.click(screen.getByText("Bad link"));
    expect(screen.getByRole("button", { name: /proceed anyway/i })).toBeTruthy();
  });

  it("does not open the warning page for safe URL", () => {
    render(<UrlSafeLink href="https://google.com">Safe link</UrlSafeLink>);
    fireEvent.click(screen.getByText("Safe link"));
    expect(screen.queryByTestId("url-warning-page")).toBeNull();
  });

  it("shows reasons in the warning page", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    fireEvent.click(screen.getByText("Bad link"));
    expect(screen.getByText(/blocklist/i)).toBeTruthy();
  });

  it("closes the warning page on cancel", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    fireEvent.click(screen.getByText("Bad link"));
    fireEvent.click(screen.getByText(/cancel/i));
    expect(screen.queryByTestId("url-warning-page")).toBeNull();
  });
});
