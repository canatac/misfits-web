/**
 * Tests for the OAuth2 start hook.
 *
 * AC2: the navigation is initiated on selection, before the start route
 * answers; the start route is only a fallback when the provider has no
 * built-in authorization endpoint.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOAuth2Start } from "../use-oauth2-start";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useOAuth2Start", () => {
  it("navigates immediately for a built-in provider, without calling the start route", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", {
      assign,
      origin: "https://mail.example",
    });
    const fetchMock = vi.fn(async () => {
      throw new Error("the start route must not be called for a built-in provider");
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("gmail");
    });

    expect(assign).toHaveBeenCalledOnce();
    const target = assign.mock.calls[0][0] as string;
    expect(target).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(target).toContain("provider=gmail");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("falls back to the start route and navigates to the returned URL", async () => {
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

  it("surfaces an error when the fallback start route fails", async () => {
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
