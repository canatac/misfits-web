/**
 * The OAuth return (misfits-web#1188, reimagined-guide#736), as it reaches
 * Next.js behind Caddy: in http, on the internal address of the container,
 * with X-Forwarded-Proto: https. Its redirects stay on the public site
 * (relative), and its cookies are Secure.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { GET } from "./route";

const INTERNAL = "http://0.0.0.0:3000";

function session(): string {
  const now = Date.now();
  return Buffer.from(
    JSON.stringify({
      id: "s-1",
      user: {
        id: "gh42@github.oauth.misfits.ai", email: "gh42@github.oauth.misfits.ai", display_name: "Octo",
        role: "user", two_factor_enabled: false, created_at: "2026-11-21T09:00:00Z", updated_at: "2026-11-21T09:00:00Z",
      },
      access_token: "a-1", refresh_token: "r-1",
      expires_at: now + 86_400_000, refresh_expires_at: now + 604_800_000, issued_at: now,
    }),
  ).toString("base64");
}

function callback(query: string): NextRequest {
  return new NextRequest(`${INTERNAL}/api/auth/callback?${query}`, { headers: { "x-forwarded-proto": "https" } });
}

describe("GET /api/auth/callback behind Caddy", () => {
  it("redirects to the dashboard of the public site, its session cookie Secure", async () => {
    const res = await GET(callback(`session=${encodeURIComponent(session())}&provider=github`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/dashboard");
    const cookie = res.cookies.get("mfa_session");
    expect(cookie?.value).toBe("s-1");
    expect(cookie?.secure).toBe(true);
    expect(cookie?.httpOnly).toBe(true);
    expect(res.cookies.get("mfa_oauth_provider")?.value).toBe("github");
  });

  it("sends a failure back to the login of the public site, never to the internal address", async () => {
    for (const query of ["error=access_denied&provider=github", "error=oauth_failed", "session=bm90LWpzb24=", ""]) {
      const res = await GET(callback(query));
      const location = res.headers.get("location") ?? "";
      expect(res.status).toBe(307);
      expect(location.startsWith("/login?error=")).toBe(true);
      expect(location).not.toContain("0.0.0.0");
    }
    expect((await GET(callback("error=access_denied"))).headers.get("location")).toBe("/login?error=oauth_cancelled");
  });

  it("is served by Next.js, not by the backend: Caddy hands it to port 3001", () => {
    const caddyfile = readFileSync(join(process.cwd(), "Caddyfile"), "utf8");
    const block = caddyfile.match(/handle \/api\/auth\/callback \{([\s\S]*?)\n    \}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toContain("reverse_proxy http://localhost:3001");
  });
});
