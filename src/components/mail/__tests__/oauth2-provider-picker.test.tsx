/**
 * Tests of the provider picker states (issue #1104).
 *
 * AC1: loading state while the catalogue is fetched
 * AC2: empty state when no provider is available
 * AC3: error state with a retry action when the catalogue request fails
 */
import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OAuth2ProviderPicker } from "@/components/mail/add-account-modal/oauth2-provider-picker";

function catalogueResponse(providers: unknown[]) {
  return new Response(JSON.stringify({ providers }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("OAuth2ProviderPicker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state while the catalogue is fetched (AC1)", async () => {
    let release: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            release = resolve;
          })
      )
    );

    render(<OAuth2ProviderPicker onSelect={() => {}} />);

    expect(screen.getByTestId("oauth2-provider-loading")).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();

    release(catalogueResponse([]));

    await waitFor(() => {
      expect(screen.queryByTestId("oauth2-provider-loading")).toBeNull();
    });
  });

  it("shows an empty state when no provider is available (AC2)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => catalogueResponse([])));

    render(<OAuth2ProviderPicker onSelect={() => {}} />);

    expect(await screen.findByTestId("oauth2-provider-empty")).toBeTruthy();
    expect(screen.queryByTestId("oauth2-provider-list")).toBeNull();
  });

  it("shows an error state with a retry action when the catalogue request fails (AC3)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "boom" } }), {
          status: 500,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        catalogueResponse([
          {
            value: "gmail",
            label: "Gmail",
            authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenEndpoint: "https://oauth2.googleapis.com/token",
            scopes: ["https://mail.google.com/"],
          },
        ])
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<OAuth2ProviderPicker onSelect={() => {}} />);

    const error = await screen.findByTestId("oauth2-provider-error");
    expect(error.textContent).toContain("HTTP 500");
    expect(screen.getByRole("alert")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByTestId("oauth2-provider-list")).toBeTruthy();
    expect(screen.queryByTestId("oauth2-provider-error")).toBeNull();
  });

  it("selects a provider from the catalogue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        catalogueResponse([
          {
            value: "gmail",
            label: "Gmail",
            authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenEndpoint: "https://oauth2.googleapis.com/token",
            scopes: ["https://mail.google.com/"],
          },
        ])
      )
    );

    const onSelect = vi.fn();
    render(<OAuth2ProviderPicker onSelect={onSelect} />);

    fireEvent.click(await screen.findByRole("button", { name: "Gmail" }));

    expect(onSelect).toHaveBeenCalledWith("gmail");
  });

  it("does not fetch while disabled", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<OAuth2ProviderPicker enabled={false} onSelect={() => {}} />);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
