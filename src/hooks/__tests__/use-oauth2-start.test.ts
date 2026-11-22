/**
 * Tests for the OAuth2 start hook.
 *
 * AC2: choosing a provider calls GET /api/external-accounts/oauth2/start
 * and navigates to the returned authorizationUrl, for every provider,
 * built-in or not; the built-in endpoints are a fallback when the start
 * route does not answer or answers without an authorizationUrl.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOAuth2Start } from "../use-oauth2-start";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useOAuth2Start", () => {
  it("calls the start route for a built-in provider and navigates to the returned authorizationUrl", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      assign,
      origin: "https://mail.example",
    });
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          authorizationUrl: "https://provider.example/authorize?state=abc",
          state: "abc",
          provider: "gmail",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("gmail");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/external-accounts/oauth2/start?provider=gmail",
      { headers: { Accept: "application/json" } }
    );
    expect(assign).toHaveBeenCalledWith(
      "https://provider.example/authorize?state=abc"
    );
    expect(result.current.error).toBeNull();
  });

  it("navigates to the URL returned by the start route for a provider without a built-in endpoint", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, origin: "https://mail.example" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            authorizationUrl: "https://provider.example/authorize?state=abc",
            state: "abc",
            provider: "other",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("other");
    });

    expect(assign).toHaveBeenCalledWith(
      "https://provider.example/authorize?state=abc"
    );
    expect(result.current.error).toBeNull();
  });

  it("surfaces the start route error for a provider without a built-in endpoint", async () => {
    vi.stubGlobal("location", { assign: vi.fn(), origin: "https://mail.example" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ message: "Provider not configured." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("other");
    });

    expect(result.current.error).toBe("Provider not configured.");
    expect(result.current.pending).toBe(false);
  });
});
