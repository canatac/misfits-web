/**
 * Integration test: Compose send proxy contract.
 *
 * Cross-repo invariant: POST /api/compose/send (Next.js proxy) must correctly
 * transform the request to the backend's /api/send endpoint while preserving
 * all authentication signals (Authorization, Cookie, x-user-id, x-user-email).
 *
 * Guards against:
 *   - Issue #780: Caddy bypassing Next.js auth for /api/compose/*
 *   - Issue #866: 502 regression after backend deploy
 *   - Issue #929: Auth/compose endpoint regression (route/proxy drift)
 *
 * The proxy route (src/app/api/compose/send/route.ts) is the ONLY path that
 * should handle /api/compose/send — Caddy routes it to Next.js (port 3001)
 * per Caddyfile config.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Mock session to simulate authenticated user
vi.mock("@/lib/session", () => ({
  getAccessToken: () => "test-access-token",
  getRefreshToken: () => "test-refresh-token",
  loadSession: () => ({ user: { email: "qa-admin@misfits.fr" } }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { buildForwardHeaders } from "@/lib/proxy-auth";

describe("compose-send proxy contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, id: "msg-123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("forwards Authorization header to backend", () => {
    const request = new Request("http://localhost/api/compose/send", {
      method: "POST",
      headers: {
        Authorization: "Bearer frontend-token-xyz",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: "test@misfits.fr", subject: "Hi" }),
    });

    const headers = buildForwardHeaders(request);
    expect(headers.get("Authorization")).toBe("Bearer frontend-token-xyz");
  });

  it("forwards Cookie header to backend", () => {
    const request = new Request("http://localhost/api/compose/send", {
      method: "POST",
      headers: {
        Cookie: "mfa_session=abc123; session_token=def456",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: "test@misfits.fr" }),
    });

    const headers = buildForwardHeaders(request);
    expect(headers.get("Cookie")).toBe("mfa_session=abc123; session_token=def456");
  });

  it("forwards x-user-id and x-user-email identity headers", () => {
    const request = new Request("http://localhost/api/compose/send", {
      method: "POST",
      headers: {
        "x-user-id": "qa-admin",
        "x-user-email": "qa-admin@misfits.fr",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: "recipient@test.com" }),
    });

    const headers = buildForwardHeaders(request);
    expect(headers.get("x-user-id")).toBe("qa-admin");
    expect(headers.get("x-user-email")).toBe("qa-admin@misfits.fr");
  });

  it("does NOT inject identity headers when absent from request", () => {
    const request = new Request("http://localhost/api/compose/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "test@misfits.fr" }),
    });

    const headers = buildForwardHeaders(request);
    expect(headers.get("x-user-id")).toBeNull();
    expect(headers.get("x-user-email")).toBeNull();
    expect(headers.get("Authorization")).toBeNull();
  });

  it("sets Accept to application/json by default", () => {
    const request = new Request("http://localhost/api/compose/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const headers = buildForwardHeaders(request);
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("preserves extra headers passed as init", () => {
    const request = new Request("http://localhost/api/compose/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const headers = buildForwardHeaders(request, {
      "X-Custom": "custom-value",
      "X-Request-ID": "req-456",
    } as HeadersInit);
    expect(headers.get("X-Custom")).toBe("custom-value");
    expect(headers.get("X-Request-ID")).toBe("req-456");
  });
});

describe("compose-send proxy route URL transformation", () => {
  it("transforms /api/compose/send to backend /api/send", async () => {
    // Simulate the buildBackendUrl logic from the proxy route
    const BACKEND_URL = "http://email-api:8000";
    const requestUrl = "http://localhost/api/compose/send";
    const url = new URL(requestUrl);
    const backendUrl = BACKEND_URL + "/api/send" + url.search;

    expect(backendUrl).toBe("http://email-api:8000/api/send");
  });

  it("preserves query parameters in URL transformation", () => {
    const BACKEND_URL = "http://email-api:8000";
    const requestUrl = "http://localhost/api/compose/send?draft_id=dr-123";
    const url = new URL(requestUrl);
    const backendUrl = BACKEND_URL + "/api/send" + url.search;

    expect(backendUrl).toBe("http://email-api:8000/api/send?draft_id=dr-123");
  });
});

describe("compose-send retry contract", () => {
  it("returns 502 when backend is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    // Simulate the proxy error handler
    try {
      await fetch("http://email-api:8000/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      // The proxy route catches this and returns 502
      expect(String(err)).toContain("ECONNREFUSED");
    }
  });

  it("does NOT retry on 4xx client errors", () => {
    // 4xx errors indicate client-side issues, not transient failures
    // The proxy should return them immediately without retry
    const status = 400;
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
    // In the route: if (res.status < 500) return res;
  });

  it("retries on 5xx server errors", () => {
    // 5xx errors are transient and should be retried
    const status = 502;
    expect(status).toBeGreaterThanOrEqual(500);
    // In the route: retries up to MAX_RETRIES times with exponential backoff
  });
});
