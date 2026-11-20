import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OAuth2ProviderPicker } from "../add-account-modal/oauth2-provider-picker";

describe("OAuth2ProviderPicker", () => {
  it("shows a loading state while the catalogue is fetched", () => {
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

  it("shows an error state with a retry action", () => {
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

  it("calls onSelect when an option is clicked", () => {
    const onSelect = vi.fn();
    render(
      <OAuth2ProviderPicker
        options={[{ value: "gmail", label: "Gmail" }]}
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
    const gmail = screen.getByRole("button", { name: /gmail/i });
    const outlook = screen.getByRole("button", { name: /outlook/i });

    // Every option is a real button, so it is reachable by keyboard (Tab).
    for (const option of [gmail, outlook]) {
      expect(option.tagName).toBe("BUTTON");
      expect(option.hasAttribute("disabled")).toBe(false);
    }

    // A native button is operable from the keyboard: Enter and Space fire click.
    gmail.focus();
    expect(document.activeElement).toBe(gmail);
    fireEvent.click(gmail);
    expect(onSelect).toHaveBeenCalledWith("gmail");

    outlook.focus();
    expect(document.activeElement).toBe(outlook);
    fireEvent.click(outlook);
    expect(onSelect).toHaveBeenCalledWith("outlook");
  });
});
