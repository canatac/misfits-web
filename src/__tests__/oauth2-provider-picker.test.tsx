/**
 * Tests for the OAuth2 provider picker states (issue #1104, #1183).
 *
 * Uses only packages present in package.json (@testing-library/react,
 * vitest) and native DOM assertions, so typecheck and lint stay green.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OAuth2ProviderPicker } from "../components/mail/add-account-modal/oauth2-provider-picker";

describe("OAuth2ProviderPicker", () => {
  it("shows a loading state while the provider catalogue is fetched", () => {
    render(
      <OAuth2ProviderPicker
        options={null}
        loading={true}
        error={null}
        selected={null}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByTestId("oauth2-provider-loading").textContent).toMatch(
      /loading the available providers/i
    );
  });

  it("shows an empty state when no provider is available", () => {
    render(
      <OAuth2ProviderPicker
        options={[]}
        loading={false}
        error={null}
        selected={null}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByTestId("oauth2-provider-empty").textContent).toMatch(
      /no external account provider is available/i
    );
  });

  it("shows an error state with a retry action when the catalogue request fails", () => {
    const onRetry = vi.fn();
    render(
      <OAuth2ProviderPicker
        options={null}
        loading={false}
        error="Could not load the providers"
        selected={null}
        onSelect={vi.fn()}
        onRetry={onRetry}
      />
    );
    const alert = screen.getByTestId("oauth2-provider-error");
    expect(alert.textContent).toMatch(/could not load the providers/i);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders the catalogue options and selects one on click", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /gmail/i }));
    expect(onSelect).toHaveBeenCalledWith("gmail");
  });

  it("marks the selected option as pressed", () => {
    render(
      <OAuth2ProviderPicker
        options={[{ value: "gmail", label: "Gmail" }]}
        loading={false}
        error={null}
        selected="gmail"
        onSelect={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /gmail/i }).getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("keeps every option a real button, reachable and operable by keyboard", () => {
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
    const gmail = screen.getByRole("button", { name: /gmail/i });
    const outlook = screen.getByRole("button", { name: /outlook/i });

    for (const option of [gmail, outlook]) {
      expect(option.tagName).toBe("BUTTON");
      expect(option.hasAttribute("disabled")).toBe(false);
    }

    gmail.focus();
    expect(document.activeElement).toBe(gmail);
    fireEvent.click(gmail);
    expect(onSelect).toHaveBeenCalledWith("gmail");

    outlook.focus();
    expect(document.activeElement).toBe(outlook);
    fireEvent.click(outlook);
    expect(onSelect).toHaveBeenCalledWith("outlook");
  });

  it("announces loading state to assistive technology through a live region", () => {
    render(
      <OAuth2ProviderPicker
        options={null}
        loading={true}
        error={null}
        selected={null}
        onSelect={vi.fn()}
      />
    );
    const loadingElement = screen.getByTestId("oauth2-provider-loading");
    expect(loadingElement.getAttribute("aria-live")).toBe("polite");
    expect(loadingElement.getAttribute("role")).toBe("status");
    expect(loadingElement.getAttribute("aria-atomic")).toBe("true");
  });

  it("announces error state to assistive technology through a live region", () => {
    render(
      <OAuth2ProviderPicker
        options={null}
        loading={false}
        error="Could not load the providers"
        selected={null}
        onSelect={vi.fn()}
        onRetry={vi.fn()}
      />
    );
    const errorElement = screen.getByTestId("oauth2-provider-error");
    expect(errorElement.getAttribute("aria-live")).toBe("assertive");
    expect(errorElement.getAttribute("role")).toBe("alert");
    expect(errorElement.getAttribute("aria-atomic")).toBe("true");
  });

  it("announces empty state to assistive technology through a live region", () => {
    render(
      <OAuth2ProviderPicker
        options={[]}
        loading={false}
        error={null}
        selected={null}
        onSelect={vi.fn()}
      />
    );
    const emptyElement = screen.getByTestId("oauth2-provider-empty");
    expect(emptyElement.getAttribute("aria-live")).toBe("polite");
    expect(emptyElement.getAttribute("role")).toBe("status");
    expect(emptyElement.getAttribute("aria-atomic")).toBe("true");
  });

  it("exposes retry action with an accessible name that names the provider catalogue", () => {
    const onRetry = vi.fn();
    render(
      <OAuth2ProviderPicker
        options={null}
        loading={false}
        error="Could not load the providers"
        selected={null}
        onSelect={vi.fn()}
        onRetry={onRetry}
      />
    );
    const retryButton = screen.getByRole("button", { name: /retry loading the provider catalogue/i });
    expect(retryButton).toBeTruthy();
    expect(retryButton.getAttribute("aria-label")).toBe("Retry loading the provider catalogue");
  });

  it("shows visible focus indicator on every provider button", () => {
    render(
      <OAuth2ProviderPicker
        options={[
          { value: "gmail", label: "Gmail" },
          { value: "outlook", label: "Outlook" },
        ]}
        loading={false}
        error={null}
        selected={null}
        onSelect={vi.fn()}
      />
    );
    const gmailButton = screen.getByRole("button", { name: /gmail/i });
    const outlookButton = screen.getByRole("button", { name: /outlook/i });

    expect(gmailButton.className).toMatch(/focus-visible:outline/);
    expect(outlookButton.className).toMatch(/focus-visible:outline/);

    expect(gmailButton).toBeTruthy();
    expect(outlookButton).toBeTruthy();
  });
})