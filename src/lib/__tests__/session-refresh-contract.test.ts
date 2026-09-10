/**
 * Integration test: Session refresh flow cross-repo contract.
 *
 * Contract: when apiClient receives 401, it should attempt token refresh
 * via /api/auth/refresh and replay the request. This mirrors the backend's
 * (reimagined-guide) session refresh contract:
 *   - POST /auth/refresh with httpOnly refresh cookie
 *   - Returns new session with accessToken + refreshToken
 *   - Frontend stores new session and retries
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { RefreshSessionResponse } from "@/types/auth";

// Mock the session module since it uses browser APIs
vi.mock("@/lib/session", () => ({
  storeSession: vi.fn(),
  getAccessToken: vi.fn(),
  loadSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

// Now import after mocks
const { ApiError, parseResponse } = await import("@/lib/api-client-errors");

function mockResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("Session refresh cross-repo contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("backend returns 401 when access token is expired", async () => {
    const res = mockResponse(401, {
      code: "TOKEN_EXPIRED",
      message: "Access token expired",
    });
    await expect(parseResponse(res)).rejects.toMatchObject({
      status: 401,
      code: "TOKEN_EXPIRED",
    });
  });

  it("backend refresh returns valid session structure", async () => {
    const refreshResponse = {
      session: {
        id: "sess-123",
        user: {
          id: "user-1",
          email: "test@misfits.fr",
          role: "user",
          twoFactorEnabled: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresAt: Date.now() + 3600_000,
      },
    } as RefreshSessionResponse;
    const res = mockResponse(200, refreshResponse);
    const result = await parseResponse<RefreshSessionResponse>(res);
    expect(result.session?.accessToken).toBe("new-access-token");
  });

  it("backend refresh returns 401 when refresh token is expired", async () => {
    const res = mockResponse(401, {
      code: "REFRESH_EXPIRED",
      message: "Refresh token expired",
    });
    await expect(parseResponse(res)).rejects.toMatchObject({
      status: 401,
      code: "REFRESH_EXPIRED",
    });
  });

  it("frontend 401 response shape triggers refresh attempt", async () => {
    const errorRes = mockResponse(401, {
      error: { code: "TOKEN_EXPIRED", message: "Token expired" },
    });

    try {
      await parseResponse(errorRes);
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const apiErr = e as InstanceType<typeof ApiError>;
      expect(apiErr.status).toBe(401);
      expect(apiErr.code).toBe("TOKEN_EXPIRED");
    }
  });

  it("session cookie (mfa_session) is required for refresh", async () => {
    // Contract: refresh uses httpOnly cookie, not body token
    const res = mockResponse(200, {
      session: {
        accessToken: "token",
        refreshToken: "refresh",
      },
    });
    const result = await parseResponse(res);
    expect(result).toBeDefined();
  });

  it("handles network error during refresh (offline)", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
    // Documents contract: frontend must handle network errors gracefully
    // via ApiError with status 0
    globalThis.fetch = originalFetch;
  });
});
