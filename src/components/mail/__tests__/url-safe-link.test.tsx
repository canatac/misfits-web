import { describe, it, expect, vi } from "vitest";
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

  it("opens warning dialog on click for suspicious URL", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    fireEvent.click(screen.getByText("Bad link"));
    expect(screen.getByText(/suspicious link warning/i)).toBeTruthy();
  });

  it("does not open dialog for safe URL", () => {
    render(<UrlSafeLink href="https://google.com">Safe link</UrlSafeLink>);
    fireEvent.click(screen.getByText("Safe link"));
    expect(screen.queryByText(/suspicious link warning/i)).toBeNull();
  });

  it("shows reasons in dialog", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    fireEvent.click(screen.getByText("Bad link"));
    expect(screen.getByText(/blocklist/i)).toBeTruthy();
  });

  it("closes dialog on cancel", () => {
    render(
      <UrlSafeLink href="https://phishing.example">Bad link</UrlSafeLink>
    );
    fireEvent.click(screen.getByText("Bad link"));
    fireEvent.click(screen.getByText(/cancel/i));
    expect(screen.queryByText(/suspicious link warning/i)).toBeNull();
  });
});
