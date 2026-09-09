import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function makeRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `https://mail.misfits.ai${pathname}`;
  const req = new NextRequest(url);
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
