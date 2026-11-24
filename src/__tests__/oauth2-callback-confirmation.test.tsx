/**
 * Tests for the OAuth2 consent callback states (issue #1178).
 *
 * Covers the confirmation naming the account and its state (AC1), its live
 * region (AC2), and the distinct revoked/expired-token error (AC3).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OAuth2CallbackPage from "../app/settings/accounts/oauth2/callback/page";
import { OAUTH2_PENDING_PROVIDER_KEY } from "../hooks/use-oauth2-start";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

describe("OAuth2CallbackPage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.pushState({}, "", "/settings/accounts/oauth2/callback");
  });

  it("shows a pending state while the authorization code is exchanged", () => {
    window.history.pushState(
      {},
      "",
      "/settings/accounts/oauth2/callback?code=abc"
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );
    render(<OAuth2CallbackPage />);
    expect(screen.getByTestId("oauth2-callback-pending")).toBeTruthy();
  });

  it("confirms the connected provider in a live region (AC1, AC2)", async () => {
    window.history.pushState(
      {},
      "",
      "/settings/accounts/oauth2/callback?code=abc"
    );
    window.sessionStorage.setItem(OAUTH2_PENDING_PROVIDER_KEY, "gmail");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }))
    );
    render(<OAuth2CallbackPage />);
    const success = await screen.findByTestId("oauth2-callback-success");
    expect(success.textContent).toMatch(/gmail/i);
    expect(success.textContent).toMatch(/connected/i);
    expect(success.getAttribute("aria-live")).toBe("polite");
  });

  it("names a revoked or expired token instead of closing silently (AC3)", async () => {
    window.history.pushState(
      {},
      "",
      "/settings/accounts/oauth2/callback?code=abc"
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: "OAUTH2_TOKEN_REVOKED", message: "revoked" },
        }),
      }))
    );
    render(<OAuth2CallbackPage />);
    const error = await screen.findByTestId("oauth2-callback-error");
    expect(error.textContent).toMatch(/revoked or expired/i);
  });
});
