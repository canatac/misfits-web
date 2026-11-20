import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UrlPhishingBanner } from "../url-phishing-banner";

describe("UrlPhishingBanner", () => {
  it("renders nothing for clean body", () => {
    const { container } = render(
      <UrlPhishingBanner body="Visit https://google.com" bodyType="text" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows warning for suspicious URLs", () => {
    render(
      <UrlPhishingBanner
        body="Click https://phishing.example/steal"
        bodyType="text"
      />
    );
    expect(screen.getByTestId("url-phishing-banner")).toBeTruthy();
    expect(screen.getByText(/suspicious link/i)).toBeTruthy();
  });

  it("lists reasons for suspicious URLs", () => {
    render(
      <UrlPhishingBanner
        body="Click https://phishing.example/steal"
        bodyType="text"
      />
    );
    expect(screen.getByText(/blocklist/i)).toBeTruthy();
  });

  it("dismisses when clicked", () => {
    render(
      <UrlPhishingBanner
        body="Click https://phishing.example/steal"
        bodyType="text"
      />
    );
    fireEvent.click(screen.getByText(/dismiss/i));
    expect(screen.queryByTestId("url-phishing-banner")).toBeNull();
  });

  it("shows correct count for multiple suspicious links", () => {
    render(
      <UrlPhishingBanner
        body="Bad https://phishing.example and https://192.168.1.1/admin"
        bodyType="text"
      />
    );
    expect(screen.getByText(/suspicious links detected/i)).toBeTruthy();
  });
});
