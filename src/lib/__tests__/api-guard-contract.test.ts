/**
 * Integration test: API guard cross-repo contract.
 *
 * api-guard.ts extracts session tokens from incoming requests (cookies
 * or Authorization header) and enforces auth. This test verifies the
 * contract between frontend auth guard and backend RBAC expectations.
 */
import { describe, it, expect } from "vitest";
import { getSessionToken } from "@/lib/api-guard";

function createMockRequest(headers: Record<string, string> = {}, cookies: Record<string, string> = {}): any {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
    ...headers,
  };
}

describe("API guard cross-repo contract", () => {
  it("extracts mfa_session cookie first", () => {
    const req = createMockRequest({}, { mfa_session: "token-123" });
    expect(getSessionToken(req)).toBe("token-123");
  });

  it("falls back to session_token cookie", () => {
    const req = createMockRequest({}, { session_token: "token-456" });
    expect(getSessionToken(req)).toBe("token-456");
  });

  it("falls back to Authorization Bearer header", () => {
    const req = createMockRequest({ authorization: "Bearer token-789" });
    expect(getSessionToken(req)).toBe("token-789");
  });

  it("prefers mfa_session over Authorization header", () => {
    const req = createMockRequest(
      { authorization: "Bearer header-token" },
      { mfa_session: "cookie-token" }
    );
    expect(getSessionToken(req)).toBe("cookie-token");
  });

  it("returns null when no auth present", () => {
    const req = createMockRequest();
    expect(getSessionToken(req)).toBeNull();
  });

  it("strips Bearer prefix from Authorization header", () => {
    const req = createMockRequest({ authorization: "Bearer my-access-token" });
    const token = getSessionToken(req);
    expect(token).toBe("my-access-token");
    expect(token).not.toContain("Bearer");
  });

  it("trims whitespace from token", () => {
    const req = createMockRequest({ authorization: "Bearer  spaced-token  " });
    expect(getSessionToken(req)).toBe("spaced-token");
  });

  it("SESSION_COOKIES priority: mfa_session before session_token", () => {
    const req = createMockRequest({}, {
      mfa_session: "primary",
      session_token: "secondary",
    });
    expect(getSessionToken(req)).toBe("primary");
  });
});
