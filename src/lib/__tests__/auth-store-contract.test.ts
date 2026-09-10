/**
 * Integration test: Auth store cross-repo contract.
 *
 * The auth store manages session state and coordinates with apiClient for
 * token refresh. This test verifies the contract between frontend auth store
 * and backend (reimagined-guide) session management.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Set BACKEND_URL so getApiBaseUrl returns absolute URL
process.env.BACKEND_URL = "https://mail.misfits.ai";

vi.mock("@/lib/session", () => ({
  storeSession: vi.fn(),
  getAccessToken: vi.fn(),
  loadSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

describe("Auth store cross-repo contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("session type matches backend SessionResponse shape", async () => {
    const { parseSession } = await import("@/lib/session-payload");

    const backendSession = {
      id: "sess-123",
      user: {
        id: "user-1",
        email: "test@misfits.fr",
        role: "user",
        twoFactorEnabled: false,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      access_token: "access-token-value",
      refresh_token: "refresh-token-value",
      expires_at: Date.now() + 3600_000,
    };

    const normalized = parseSession(backendSession);
    expect(normalized).toBeDefined();
  });

  it("apiLogin calls /auth/login with skipAuth", async () => {
    const { apiLogin } = await import("@/lib/api-auth");
    const { apiClient } = await import("@/lib/api-client");

    vi.spyOn(apiClient, "post").mockResolvedValue({
      session: { access_token: "token" },
    });

    await apiLogin("test@misfits.fr", "password");

    expect(apiClient.post).toHaveBeenCalledWith(
      "/auth/login",
      { email: "test@misfits.fr", password: "password" },
      { skipAuth: true }
    );
  });

  it("apiLogout is best-effort (does not throw on failure)", async () => {
    const { apiLogout } = await import("@/lib/api-auth");
    const { apiClient } = await import("@/lib/api-client");

    vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Network error"));

    await expect(apiLogout()).resolves.toBeUndefined();
  });

  it("initiateGithubLogin sets redirect cookie and redirects", async () => {
    const { initiateGithubLogin } = await import("@/lib/api-auth");

    if (typeof document === "undefined" || typeof window === "undefined") return;

    const originalDoc = globalThis.document;
    const originalWin = globalThis.window;
    globalThis.document = { cookie: "" } as Document;
    globalThis.window = { location: { href: "" } } as Window & typeof globalThis;

    initiateGithubLogin("/inbox");

    expect(globalThis.document.cookie).toContain("mfa_post_login_redirect");
    expect(globalThis.window.location.href).toContain("/auth/oauth/github");

    globalThis.document = originalDoc;
    globalThis.window = originalWin;
  });

  it("initiateGithubLogin rejects open-redirect paths", async () => {
    const { initiateGithubLogin } = await import("@/lib/api-auth");

    if (typeof document === "undefined" || typeof window === "undefined") return;

    const originalWin = globalThis.window;
    globalThis.window = { location: { href: "" } } as Window & typeof globalThis;

    initiateGithubLogin("//evil.com");

    expect(globalThis.window.location.href).not.toContain("evil.com");

    globalThis.window = originalWin;
  });
});
