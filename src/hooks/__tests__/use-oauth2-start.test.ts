/**
 * Tests for the OAuth2 start hook: it calls the start endpoint and redirects
 * to the returned authorization URL.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useOAuth2Start } from "../use-oauth2-start";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useOAuth2Start", () => {
  it("redirects to the authorization URL returned by the start endpoint", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            authorizationUrl: "https://provider.example/authorize?state=abc",
            state: "abc",
            provider: "gmail",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("gmail");
    });

    await waitFor(() => expect(assign).toHaveBeenCalledOnce());
    expect(assign).toHaveBeenCalledWith(
      "https://provider.example/authorize?state=abc"
    );
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error when the start endpoint fails", async () => {
    vi.stubGlobal("location", { assign: vi.fn() });
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
      await result.current.start("outlook");
    });

    expect(result.current.error).toBe("Provider not configured.");
    expect(result.current.pending).toBe(false);
  });
});
