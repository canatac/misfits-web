/**
 * Tests for the OAuth2 start hook (issue #1119 AC2).
 *
 * AC2: choosing a provider calls GET /api/external-accounts/oauth2/start
 * and navigates to the returned authorizationUrl, for every provider. The
 * built-in endpoints are a fallback when the start route does not answer or
 * answers without an authorizationUrl.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useOAuth2Start } from "@/hooks/use-oauth2-start";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useOAuth2Start", () => {
  it("calls the start route for a built-in provider and navigates to the returned authorizationUrl", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, origin: "https://mail.example" });
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

  it("falls back to the built-in endpoint when the start route answers without an authorizationUrl", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, origin: "https://mail.example" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ provider: "gmail" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("gmail");
    });

    expect(assign).toHaveBeenCalledOnce();
    const target = assign.mock.calls[0][0] as string;
    expect(target).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(target).toContain("provider=gmail");
    expect(result.current.error).toBeNull();
  });

  it("falls back to the built-in endpoint when the start route does not answer", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, origin: "https://mail.example" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("gmail");
    });

    expect(assign).toHaveBeenCalledOnce();
    const target = assign.mock.calls[0][0] as string;
    expect(target).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(result.current.error).toBeNull();
  });

  it("surfaces the start route error for a provider without a built-in endpoint", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, origin: "https://mail.example" });
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ message: "Unknown provider." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useOAuth2Start());
    await act(async () => {
      await result.current.start("unknown");
    });

    expect(assign).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Unknown provider.");
    expect(result.current.pending).toBe(false);
  });
});
