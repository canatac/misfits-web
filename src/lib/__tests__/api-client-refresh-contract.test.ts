/**
 * API Client Refresh Contract Tests
 *
 * Cross-repo invariant: the frontend api-client must correctly handle
 * the 401 → refresh → replay flow against the backend refresh endpoint
 * (reimagined-guide /auth/refresh). Token refresh must be single-flight
 * and the replayed request must carry the new access token.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mutable mock functions for session module
const mockGetAccessToken = vi.fn();
const mockLoadSession = vi.fn();
const mockStoreSession = vi.fn();
const mockClearSession = vi.fn();

vi.mock("@/lib/session", () => ({
  getAccessToken: () => mockGetAccessToken(),
  loadSession: () => mockLoadSession(),
  storeSession: (...args: unknown[]) => mockStoreSession(...args),
  clearSession: () => mockClearSession(),
}));

// Mutable mock for session-payload parseSession
const mockParseSession = vi.fn();
vi.mock("@/lib/session-payload", () => ({
  parseSession: (raw: unknown) => mockParseSession(raw),
}));

import type { Session } from "@/types/auth";

describe("api-client refresh contract", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mockGetAccessToken.mockReset();
    mockLoadSession.mockReset();
    mockStoreSession.mockReset();
    mockClearSession.mockReset();
    mockParseSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports apiClient with all HTTP verbs", async () => {
    const { apiClient } = await import("@/lib/api-client");
    expect(typeof apiClient.get).toBe("function");
    expect(typeof apiClient.post).toBe("function");
    expect(typeof apiClient.put).toBe("function");
    expect(typeof apiClient.patch).toBe("function");
    expect(typeof apiClient.delete).toBe("function");
  });

  it("getApiBaseUrl returns /api by default", async () => {
    const { getApiBaseUrl } = await import("@/lib/api-client");
    expect(getApiBaseUrl()).toBe("/api");
  });

  it("refreshSession calls /auth/refresh with POST and credentials", async () => {
    const { refreshSession } = await import("@/lib/api-client");

    const validSession: Session = {
      id: "sess_new",
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
      expiresAt: 1726137600,
      refreshExpiresAt: 1726742400,
      issuedAt: 1726134000,
      user: {
        id: "u1",
        email: "test@misfits.fr",
        role: "user",
        twoFactorEnabled: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    };

    mockParseSession.mockReturnValue(validSession);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          session: {
            id: "sess_new",
            access_token: "new_access_token",
            refresh_token: "new_refresh_token",
            expires_at: 1726137600,
            refresh_expires_at: 1726742400,
            issued_at: 1726134000,
            user: {
              id: "u1",
              email: "test@misfits.fr",
              role: "user",
              two_factor_enabled: false,
              created_at: "2026-01-01",
              updated_at: "2026-01-01",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const token = await refreshSession();
    expect(token).toBe("new_access_token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/refresh");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("refreshSession returns null on 401", async () => {
    const { refreshSession } = await import("@/lib/api-client");

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    const token = await refreshSession();
    expect(token).toBeNull();
  });

  it("refreshSession returns null on network error", async () => {
    const { refreshSession } = await import("@/lib/api-client");

    fetchMock.mockRejectedValueOnce(new Error("Network failed"));

    const token = await refreshSession();
    expect(token).toBeNull();
  });

  it("refreshSession returns null on invalid session payload", async () => {
    const { refreshSession } = await import("@/lib/api-client");

    mockParseSession.mockReturnValue(null);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ session: { id: "incomplete" } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const token = await refreshSession();
    expect(token).toBeNull();
  });

  it("single-flight: concurrent refreshSession calls share one fetch", async () => {
    const { refreshSession } = await import("@/lib/api-client");

    const validSession: Session = {
      id: "sess_single",
      accessToken: "single_token",
      refreshToken: "rt",
      expiresAt: 1,
      refreshExpiresAt: 2,
      issuedAt: 3,
      user: {
        id: "u1",
        email: "test@misfits.fr",
        role: "user",
        twoFactorEnabled: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    };

    mockParseSession.mockReturnValue(validSession);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          session: {
            id: "sess_single",
            access_token: "single_token",
            refresh_token: "rt",
            expires_at: 1,
            refresh_expires_at: 2,
            issued_at: 3,
            user: {
              id: "u1",
              email: "test@misfits.fr",
              role: "user",
              two_factor_enabled: false,
              created_at: "2026-01-01",
              updated_at: "2026-01-01",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const [t1, t2, t3] = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ]);

    expect(t1).toBe("single_token");
    expect(t2).toBe("single_token");
    expect(t3).toBe("single_token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("apiClient.get sends Authorization header when token present", async () => {
    mockGetAccessToken.mockReturnValue("bearer_token_123");
    mockLoadSession.mockReturnValue({ user: { email: "test@misfits.fr" } });

    const { apiClient } = await import("@/lib/api-client");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiClient.get("/test");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/test");
    expect(init.headers.get("Authorization")).toBe("Bearer bearer_token_123");
    expect(init.headers.get("x-user-email")).toBe("test@misfits.fr");
    expect(init.headers.get("x-user-id")).toBe("test");
  });

  it("apiClient.post sets Content-Type and stringifies body", async () => {
    mockGetAccessToken.mockReturnValue(null);
    mockLoadSession.mockReturnValue(null);

    const { apiClient } = await import("@/lib/api-client");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ created: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiClient.post("/emails", { subject: "Hello" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ subject: "Hello" }));
  });

  it("apiClient skips auth when skipAuth is true", async () => {
    mockGetAccessToken.mockReturnValue("should_not_be_sent");
    mockLoadSession.mockReturnValue({ user: { email: "test@misfits.fr" } });

    const { apiClient } = await import("@/lib/api-client");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ public: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiClient.get("/public/health", { skipAuth: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(init.headers.get("Authorization")).toBeNull();
    expect(init.headers.get("x-user-email")).toBeNull();
  });

  it("apiClient throws ApiError on network failure", async () => {
    mockGetAccessToken.mockReturnValue(null);
    mockLoadSession.mockReturnValue(null);

    const { apiClient, ApiError } = await import("@/lib/api-client");

    fetchMock.mockRejectedValueOnce(new Error("Connection refused"));

    await expect(apiClient.get("/fail")).rejects.toThrow(ApiError);
  });

  it("x-user-id uses full email when no @ present", async () => {
    mockGetAccessToken.mockReturnValue(null);
    mockLoadSession.mockReturnValue({ user: { email: "admin" } });

    const { apiClient } = await import("@/lib/api-client");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiClient.get("/test");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.get("x-user-id")).toBe("admin");
  });
});
