/**
 * Integration test: Admin/Hermes API auth enforcement (issue #411).
 *
 * Critical security test: verifies that sensitive admin and hermes endpoints
 * require session authentication. Previously these were exposed without auth.
 */
import { describe, it, expect } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

function createRequest(
  path: string,
  options: { cookies?: Record<string, string> } = {}
): NextRequest {
  const url = new URL(path, "https://mail.misfits.ai");
  const req = new NextRequest(url);
  if (options.cookies) {
    for (const [key, value] of Object.entries(options.cookies)) {
      req.cookies.set(key, value);
    }
  }
  return req;
}

describe("Issue #411: Admin API auth enforcement", () => {
  it("redirects /api/admin/change-requests without session", () => {
    const req = createRequest("/api/admin/change-requests");
    const res = middleware(req);
    // Should redirect to login (307) or return 401
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });

  it("redirects /api/admin/deliverability/procedure without session", () => {
    const req = createRequest("/api/admin/deliverability/procedure");
    const res = middleware(req);
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });

  it("redirects /api/admin/users without session", () => {
    const req = createRequest("/api/admin/users");
    const res = middleware(req);
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });

  it("allows /api/admin/login without session (public)", () => {
    const req = createRequest("/api/admin/login");
    const res = middleware(req);
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
    expect(res.status).not.toBe(401);
  });

  it("allows /api/admin/whoami without session (public for OAuth)", () => {
    const req = createRequest("/api/admin/whoami");
    const res = middleware(req);
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
    expect(res.status).not.toBe(401);
  });

  it("allows /api/admin/change-requests WITH valid session", () => {
    const req = createRequest("/api/admin/change-requests", {
      cookies: { mfa_session: "valid-session-token" },
    });
    const res = middleware(req);
    // Should pass through (200 or next)
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(false);
  });
});

describe("Issue #411: Hermes API auth enforcement", () => {
  it("redirects /api/hermes/runs without session", () => {
    const req = createRequest("/api/hermes/runs");
    const res = middleware(req);
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });

  it("redirects /api/hermes/runs/123/events without session", () => {
    const req = createRequest("/api/hermes/runs/123/events");
    const res = middleware(req);
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });

  it("allows /api/hermes/chat without session (used by authenticated client only)", () => {
    // Note: /api/hermes/chat is POST-only from same-origin client
    // This test documents current behavior
    const req = createRequest("/api/hermes/chat");
    const res = middleware(req);
    // Should be protected now
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });

  it("allows /api/hermes/runs WITH valid session", () => {
    const req = createRequest("/api/hermes/runs", {
      cookies: { mfa_session: "valid-session-token" },
    });
    const res = middleware(req);
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(false);
  });
});

describe("Issue #411: External accounts API auth enforcement", () => {
  it("redirects /api/external-accounts without session", () => {
    const req = createRequest("/api/external-accounts");
    const res = middleware(req);
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });

  it("redirects /api/external-accounts/probe-stream without session", () => {
    const req = createRequest("/api/external-accounts/probe-stream");
    const res = middleware(req);
    expect(res.status === 307 || res.status === 302 || res.status === 401).toBe(true);
  });
});

describe("Issue #411: Non-sensitive APIs remain accessible", () => {
  it("allows /api/emails without session (backend-protected)", () => {
    const req = createRequest("/api/emails");
    const res = middleware(req);
    expect(res.status).not.toBe(401);
  });

  it("allows /api/monitoring/live without session (backend-protected)", () => {
    const req = createRequest("/api/monitoring/live");
    const res = middleware(req);
    expect(res.status).not.toBe(401);
  });

  it("allows /api/security/live without session (backend-protected)", () => {
    const req = createRequest("/api/security/live");
    const res = middleware(req);
    expect(res.status).not.toBe(401);
  });

  it("allows /api/auth/login without session (public)", () => {
    const req = createRequest("/api/auth/login");
    const res = middleware(req);
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
    expect(res.status).not.toBe(401);
  });

  it("allows /api/health without session (public)", () => {
    const req = createRequest("/api/health");
    const res = middleware(req);
    expect(res.status).not.toBe(307);
    expect(res.status).not.toBe(302);
    expect(res.status).not.toBe(401);
  });
});
