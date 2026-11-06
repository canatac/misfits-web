/**
 * Tests for the OAuth2 provider picker states and keyboard operability.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getByTestId("oauth2-provider-loading")).toHaveTextContent(
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
    expect(screen.getByTestId("oauth2-provider-empty")).toHaveTextContent(
      /no oauth2 provider is available/i
    );
  });

  it("shows an error state with a retry action", async () => {
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
    expect(screen.getByTestId("oauth2-provider-error")).toHaveTextContent(
      /http 500/i
    );
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders the catalogue options and selects one on click", async () => {
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
    await userEvent.click(screen.getByTestId("oauth2-provider-gmail"));
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
    expect(screen.getByRole("radio", { name: /gmail/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("reaches every option by keyboard", async () => {
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
    expect(gmail).toHaveFocus();
    await userEvent.tab();
    expect(outlook).toHaveFocus();
    await userEvent.tab();
    expect(other).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("other");
  });
});
