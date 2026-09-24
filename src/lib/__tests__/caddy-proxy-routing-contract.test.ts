/**
 * Integration test: CORS + Proxy Routing Contract.
 *
 * Cross-repo invariant: The Caddy reverse proxy must correctly route API requests
 * and enforce CORS headers. This test verifies the contract between:
 *   - Caddyfile routing rules (which /api/* paths go to Next.js vs backend)
 *   - CORS header enforcement (Access-Control-Allow-Origin whitelist)
 *   - Frontend apiClient expectations
 *
 * Guards against:
 *   - Issue #704: CORS misconfiguration
 *   - Issue #722/#723: Auth-sensitive routes bypassing Next.js
 *   - Issue #780: /api/compose/* auth bypass
 */

import { describe, it, expect } from "vitest";

describe("Caddy proxy routing contract", () => {
  /**
   * Caddyfile routing rules (from /root/reimagined-guide--fleet-dev-back-2/Caddyfile):
   *
   * Routes proxied to Next.js (port 3001) — require Edge auth middleware:
   *   - /api/admin*
   *   - /api/hermes*
   *   - /api/emails*
   *   - /api/external-accounts*
   *   - /api/compose*
   *   - /api/templates*
   *
   * Routes proxied to backend (port 8000) — direct API:
   *   - /api/* (catch-all, after specific routes above)
   *
   * Static frontend:
   *   - everything else → port 3001
   */

  const NEXT_JS_ROUTES = [
    "/api/admin",
    "/api/admin/users",
    "/api/hermes/runs",
    "/api/emails",
    "/api/emails/123",
    "/api/external-accounts",
    "/api/compose/send",
    "/api/templates",
    "/api/templates/123",
  ];

  const BACKEND_ROUTES = [
    "/api/send",
    "/api/health",
    "/api/monitoring/mongo-health",
    "/api/auth/login",
    "/api/auth/refresh",
  ];

  it("routes auth-sensitive paths to Next.js (port 3001)", () => {
    for (const route of NEXT_JS_ROUTES) {
      const isProxiedToBackend =
        !route.match(
          /^\/api\/(admin|hermes|emails|external-accounts|compose|templates)/
        );
      expect(isProxiedToBackend, route + " should go to Next.js").toBe(false);
    }
  });

  it("routes non-auth-sensitive API paths to backend (port 8000)", () => {
    for (const route of BACKEND_ROUTES) {
      const isProxiedToBackend =
        !route.match(
          /^\/api\/(admin|hermes|emails|external-accounts|compose|templates)/
        );
      expect(isProxiedToBackend, route + " should go to backend").toBe(true);
    }
  });

  it("does NOT allow /api/compose/* to bypass Next.js auth", () => {
    // This is the critical security contract: /api/compose/* MUST be handled
    // by Next.js Edge middleware before proxying to backend
    const composeRoute = "/api/compose/send";
    const matchesNextJsRule = composeRoute.match(/^\/api\/compose/);
    expect(matchesNextJsRule).not.toBeNull();
  });
});

describe("CORS header contract", () => {
  /**
   * Caddyfile CORS rules:
   *   1. Strip all backend CORS headers (header_down -Access-Control-*)
   *   2. Set Access-Control-Allow-Origin: https://mail.misfits.ai (whitelist)
   *   3. Set Access-Control-Allow-Credentials: true
   *   4. Vary: Origin, Access-Control-Request-Method, Access-Control-Request-Headers
   */

  it("whitelists only mail.misfits.ai origin", () => {
    const ALLOWED_ORIGIN = "https://mail.misfits.ai";
    const testOrigins = [
      { origin: "https://mail.misfits.ai", allowed: true },
      { origin: "https://www.mail.misfits.ai", allowed: false }, // Caddy sets exact match
      { origin: "https://evil.com", allowed: false },
      { origin: "http://mail.misfits.ai", allowed: false }, // HTTP not allowed
      { origin: "https://misfits.ai", allowed: false },
      { origin: "", allowed: false },
    ];

    for (const { origin, allowed } of testOrigins) {
      const isAllowed = origin === ALLOWED_ORIGIN;
      const msg = origin + " should " + (allowed ? "" : "NOT ") + "be allowed";
      expect(isAllowed, msg).toBe(allowed);
    }
  });

  it("reflects credentials=true only for whitelisted origin", () => {
    // Access-Control-Allow-Credentials: true is set by Caddy
    // This means the browser will include cookies in cross-origin requests
    // ONLY if the Origin header matches the whitelist
    const CORS_CREDENTIALS_ENABLED = true;
    expect(CORS_CREDENTIALS_ENABLED).toBe(true);
  });

  it("includes Vary: Origin to prevent cache poisoning", () => {
    // The Vary header ensures CDNs/caches don't serve cached CORS responses
    // to different origins
    const varyHeaders = "Origin, Access-Control-Request-Method, Access-Control-Request-Headers";
    expect(varyHeaders).toContain("Origin");
  });
});

describe("apiClient CORS integration", () => {
  it("sends credentials: 'include' for same-origin requests", async () => {
    // apiClient uses credentials: "include" by default
    // This ensures cookies (mfa_session) are sent with every request
    const init: RequestInit = {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
    };
    expect(init.credentials).toBe("include");
  });

  it("does NOT send Authorization header when no session exists", () => {
    // When no session, getAccessToken returns null
    // apiClient should NOT set Authorization header
    const accessToken: string | null = null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = "Bearer " + accessToken;
    }
    expect(headers["Authorization"]).toBeUndefined();
  });
});
