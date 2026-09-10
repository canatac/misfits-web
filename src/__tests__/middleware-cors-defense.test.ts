/**
 * Integration test: CORS origin validation in middleware (issue #401).
 *
 * Verifies that the middleware blocks cross-origin requests from non-allowed
 * origins and allows same-origin + whitelisted origins.
 */
import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

function createRequest(
  path: string,
  options: { origin?: string; method?: string; cookies?: Record<string, string> } = {}
): NextRequest {
  const url = new URL(path, "https://mail.misfits.ai");
  const req = new NextRequest(url, {
    method: options.method || "GET",
    headers: options.origin ? { origin: options.origin } : {},
  });
  if (options.cookies) {
    for (const [key, value] of Object.entries(options.cookies)) {
      req.cookies.set(key, value);
    }
  }
  return req;
}

describe("Middleware CORS defense-in-depth (issue #401)", () => {
  it("blocks cross-origin API request from arbitrary origin", () => {
    const req = createRequest("/api/emails", {
      origin: "https://evil.com",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });

  it("allows same-origin API request (no Origin header)", () => {
    const req = createRequest("/api/emails");
    const res = middleware(req);
    expect(res.status).not.toBe(403);
  });

  it("allows cross-origin API request from mail.misfits.ai", () => {
    const req = createRequest("/api/emails", {
      origin: "https://mail.misfits.ai",
    });
    const res = middleware(req);
    expect(res.status).not.toBe(403);
  });

  it("allows localhost:3000 for development", () => {
    const req = createRequest("/api/emails", {
      origin: "http://localhost:3000",
    });
    const res = middleware(req);
    expect(res.status).not.toBe(403);
  });

  it("allows localhost:3001 for development", () => {
    const req = createRequest("/api/emails", {
      origin: "http://localhost:3001",
    });
    const res = middleware(req);
    expect(res.status).not.toBe(403);
  });

  it("does NOT block non-API routes (no origin check)", () => {
    const req = createRequest("/inbox", {
      origin: "https://evil.com",
    });
    // Non-API routes are protected by session, not CORS
    // The middleware either redirects (no cookie) or next()
    const res = middleware(req);
    expect(res.status).not.toBe(403);
  });

  it("blocks cross-origin on /api/admin/users", () => {
    const req = createRequest("/api/admin/users", {
      origin: "https://evil.com",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });

  it("blocks cross-origin on /api/external-accounts", () => {
    const req = createRequest("/api/external-accounts", {
      origin: "https://evil.com",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });
});
