import { describe, expect, it } from "vitest";
import { getSessionToken } from "@/lib/api-guard";
import { NextRequest } from "next/server";

function createRequest(cookies: Record<string, string> = {}, headers: Record<string, string> = {}): NextRequest {
  const url = "https://mail.misfits.ai/api/test";
  const req = new NextRequest(new Request(url, { headers }));
  // Manually set cookies
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe("getSessionToken", () => {
  it("returns mfa_session cookie when present", () => {
    const req = createRequest({ mfa_session: "token-123" });
    expect(getSessionToken(req)).toBe("token-123");
  });

  it("returns session_token cookie when mfa_session absent", () => {
    const req = createRequest({ session_token: "rbac-token" });
    expect(getSessionToken(req)).toBe("rbac-token");
  });

  it("returns Bearer token from Authorization header", () => {
    const req = createRequest({}, { authorization: "Bearer jwt-token" });
    expect(getSessionToken(req)).toBe("jwt-token");
  });

  it("prefers mfa_session over Authorization header", () => {
    const req = createRequest({ mfa_session: "cookie-token" }, { authorization: "Bearer header-token" });
    expect(getSessionToken(req)).toBe("cookie-token");
  });

  it("returns null when no auth present", () => {
    const req = createRequest();
    expect(getSessionToken(req)).toBeNull();
  });

  it("returns null for malformed Authorization header", () => {
    const req = createRequest({}, { authorization: "NotBearer token" });
    expect(getSessionToken(req)).toBeNull();
  });
});
