/**
 * Tests for the OAuth2 provider picker states and keyboard operability.
 *
 * Uses only packages present in package.json (@testing-library/react,
 * vitest) and native DOM assertions, so typecheck and lint stay green.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OAuth2ProviderPicker } from "../add-account-modal/oauth2-provider-picker";

describe("OAuth2ProviderPicker", () => {
  it("shows a loading state while the catalogue is fetched", () => {
    render(
      <OAuth2ProviderPicker
        options={null}
        loading
        error={null}
        selected={null}
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("oauth2-provider-loading").textContent).toMatch(
      /loading providers/i
    );
  });

  it("shows an empty state when the catalogue returns no provider", () => {
    render(
      <OAuth2ProviderPicker
        options={[]}
        loading={false}
        error={null}
        selected={null}
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("oauth2-provider-empty").textContent).toMatch(
      /no oauth2 provider is available/i
    );
  });

  it("shows an error state with a retry action", () => {
    const onRetry = vi.fn();
    render(
      <OAuth2ProviderPicker
        options={null}
        loading={false}
        error="Provider catalogue request failed (HTTP 500)."
        selected={null}
        onSelect={() => {}}
        onRetry={onRetry}
      />
    );
    expect(screen.getByTestId("oauth2-provider-error").textContent).toMatch(
      /http 500/i
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders the catalogue options and selects one on click", () => {
    const onSelect = vi.fn();
    render(
      <OAuth2ProviderPicker
        options={[
          { value: "gmail", label: "Gmail" },
          { value: "outlook", label: "Outlook" },
          { value: "yahoo", label: "Yahoo" },
        ]}
        loading={false}
        error={null}
        selected={null}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByTestId("oauth2-provider-gmail"));
    expect(onSelect).toHaveBeenCalledWith("gmail");
  });

  it("marks the selected option as checked", () => {
    render(
      <OAuth2ProviderPicker
        options={[{ value: "gmail", label: "Gmail" }]}
        loading={false}
        error={null}
        selected="gmail"
        onSelect={() => {}}
      />
    );
    expect(
      screen.getByRole("radio", { name: /gmail/i }).getAttribute("aria-checked")
    ).toBe("true");
  });

  it("reaches every option by keyboard", () => {
    const onSelect = vi.fn();
    render(
      <OAuth2ProviderPicker
        options={[
          { value: "gmail", label: "Gmail" },
          { value: "outlook", label: "Outlook" },
        ]}
        loading={false}
        error={null}
        selected={null}
        onSelect={onSelect}
      />
    );
    const gmail = screen.getByTestId("oauth2-provider-gmail");
    const outlook = screen.getByTestId("oauth2-provider-outlook");
    const other = screen.getByTestId("oauth2-provider-other");

    gmail.focus();
    expect(document.activeElement).toBe(gmail);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    expect(document.activeElement).toBe(outlook);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    expect(document.activeElement).toBe(other);

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("other");
  });
});
