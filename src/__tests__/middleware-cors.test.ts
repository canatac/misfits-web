import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

function createRequest(
  url: string,
  options: { origin?: string; method?: string } = {}
): NextRequest {
  const { origin, method = "GET" } = options;
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new NextRequest(new Request(url, { method, headers }));
}

describe("middleware CORS defense-in-depth", () => {
  it("blocks API requests from disallowed origins", () => {
    const req = createRequest("https://mail.misfits.ai/api/emails", {
      origin: "https://evil.com",
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("allows API requests from allowed origins", () => {
    const req = createRequest("https://mail.misfits.ai/api/emails", {
      origin: "https://mail.misfits.ai",
    });
    const res = middleware(req);
    // Should NOT be 403 (may be 200 or 307 redirect for auth)
    expect(res.status).not.toBe(403);
  });

  it("does not block non-API routes from cross-origin", () => {
    const req = createRequest("https://mail.misfits.ai/inbox", {
      origin: "https://evil.com",
    });
    const res = middleware(req);
    // Inbox requires auth redirect (307), not CORS block
    expect(res.status).toBe(307);
  });

  it("does not set CORS headers on blocked requests", () => {
    const req = createRequest("https://mail.misfits.ai/api/emails", {
      origin: "https://evil.com",
    });
    const res = middleware(req);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });
});
