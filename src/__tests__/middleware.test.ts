import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function makeRequest(
  pathname: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {}
): NextRequest {
  const url = `https://mail.misfits.ai${pathname}`;
  const req = new NextRequest(url, { headers });
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe("middleware /inbox redirect (issue-383)", () => {
  it("redirects unauthenticated /inbox to /login with redirect param", () => {
    const req = makeRequest("/inbox");
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("redirect=");
    expect(location).toContain("inbox");
  });

  it("redirects unauthenticated /inbox/page/2 to /login", () => {
    const req = makeRequest("/inbox/page/2");
    const res = middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
  });

  it("allows /inbox when session cookie is present", () => {
    const req = makeRequest("/inbox", { mfa_session: "valid-token" });
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("still redirects unauthenticated /mail to /login", () => {
    const req = makeRequest("/mail");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows public routes without session", () => {
    for (const path of ["/", "/login", "/reset-password"]) {
      const req = makeRequest(path);
      const res = middleware(req);
      expect(res.status).toBe(200);
    }
  });
});

describe("middleware API auth bypass regression (issue #767, MW-2026-029)", () => {
  describe("P0: /api/emails requires authentication", () => {
    it("returns 401 JSON for unauthenticated GET /api/emails", () => {
      const req = makeRequest("/api/emails");
      const res = middleware(req);
      expect(res.status).toBe(401);
      expect(res.headers.get("content-type")).toContain("application/json");
    });

    it("returns 401 JSON for unauthenticated GET /api/emails/some-id", () => {
      const req = makeRequest("/api/emails/some-uuid");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("allows /api/emails with valid session cookie", () => {
      const req = makeRequest("/api/emails", { mfa_session: "valid-token" });
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe("P0: /api/hermes/runs requires authentication", () => {
    it("returns 401 JSON for unauthenticated GET /api/hermes/runs", () => {
      const req = makeRequest("/api/hermes/runs");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 JSON for unauthenticated GET /api/hermes/runs/task-123", () => {
      const req = makeRequest("/api/hermes/runs/task-123");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("allows /api/hermes/runs with valid session cookie", () => {
      const req = makeRequest("/api/hermes/runs", { mfa_session: "valid-token" });
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe("P0: /api/admin/* requires authentication", () => {
    it("returns 401 JSON for unauthenticated GET /api/admin/ai-activity", () => {
      const req = makeRequest("/api/admin/ai-activity");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 JSON for unauthenticated GET /api/admin/audit-log", () => {
      const req = makeRequest("/api/admin/audit-log");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 JSON for unauthenticated GET /api/admin/users", () => {
      const req = makeRequest("/api/admin/users");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("allows /api/admin/ai-activity with valid session cookie", () => {
      const req = makeRequest("/api/admin/ai-activity", { mfa_session: "valid-token" });
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows /api/admin/whoami without session (public endpoint)", () => {
      const req = makeRequest("/api/admin/whoami");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows /api/admin/login without session (public endpoint)", () => {
      const req = makeRequest("/api/admin/login");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe("P0: CORS origin reflection defense (issue #401)", () => {
    it("blocks cross-origin API request from evil origin with 403", () => {
      const req = makeRequest("/api/emails", {}, { Origin: "https://evil.example.com" });
      const res = middleware(req);
      expect(res.status).toBe(403);
    });

    it("does NOT reflect arbitrary origin in Access-Control-Allow-Origin", () => {
      const req = makeRequest("/api/emails", {}, { Origin: "https://evil.example.com" });
      const res = middleware(req);
      const acao = res.headers.get("access-control-allow-origin");
      expect(acao).not.toBe("https://evil.example.com");
    });

    it("allows same-origin request from mail.misfits.ai", () => {
      const req = makeRequest("/api/emails", { mfa_session: "valid-token" }, { Origin: "https://mail.misfits.ai" });
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows request with no Origin header (same-origin)", () => {
      const req = makeRequest("/api/emails", { mfa_session: "valid-token" });
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe("P1: /api/external-accounts requires authentication", () => {
    it("returns 401 JSON for unauthenticated GET /api/external-accounts", () => {
      const req = makeRequest("/api/external-accounts");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 JSON for unauthenticated GET /api/external-accounts/123", () => {
      const req = makeRequest("/api/external-accounts/123");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });

    it("allows /api/external-accounts with valid session cookie", () => {
      const req = makeRequest("/api/external-accounts", { mfa_session: "valid-token" });
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Public API routes remain accessible without session", () => {
    it("allows /api/auth/login without session", () => {
      const req = makeRequest("/api/auth/login");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows /api/auth/callback without session", () => {
      const req = makeRequest("/api/auth/callback");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("allows /api/health without session", () => {
      const req = makeRequest("/api/health");
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("returns 401 JSON for /api/compose/send without session (protected API route, issue #1025/#1028)", () => {
      const req = makeRequest("/api/compose/send");
      const res = middleware(req);
      expect(res.status).toBe(401);
    });
  });
});
