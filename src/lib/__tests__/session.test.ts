import { beforeEach, describe, expect, it, vi } from "vitest";

type SessionModule = typeof import("@/lib/session");
type AuthStoreModule = typeof import("@/stores/auth-store");

function createSession(overrides: Partial<import("@/types/auth").Session> = {}) {
  const now = Date.now();
  return {
    id: "session-123",
    accessToken: "access-token-123",
    refreshToken: "refresh-token-123",
    expiresAt: now + 15 * 60 * 1000,
    refreshExpiresAt: now + 24 * 60 * 60 * 1000,
    issuedAt: now,
    user: {
      id: "user-123",
      email: "user@misfits.ai",
      role: "admin" as const,
      twoFactorEnabled: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

async function importFreshModules(): Promise<{
  session: SessionModule;
  authStore: AuthStoreModule;
}> {
  vi.resetModules();
  return {
    session: await import("@/lib/session"),
    authStore: await import("@/stores/auth-store"),
  };
}

describe("session persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.cookie = "mfa_session=; Max-Age=0; Path=/; Secure";
    document.cookie = "mfa_oauth_provider=; Max-Age=0; Path=/; Secure";
  });

  it("stores only the session handle in the cookie and rehydrates after refresh", async () => {
    const initial = await importFreshModules();
    const session = createSession();

    initial.session.storeSession(session, true);

    expect(document.cookie).toContain("mfa_session=session-123");
    expect(document.cookie).not.toContain("access-token-123");
    expect(document.cookie).not.toContain("refresh-token-123");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ session }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const refreshed = await importFreshModules();
    await refreshed.authStore.useAuthStore.getState().hydrate();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );

    const state = refreshed.authStore.useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.session?.id).toBe(session.id);
    expect(state.session?.accessToken).toBe(session.accessToken);
    expect(state.user?.email).toBe(session.user.email);
  });

  it("clears expired sessions instead of restoring them after refresh", async () => {
    const initial = await importFreshModules();
    initial.session.storeSession(createSession(), true);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const refreshed = await importFreshModules();
    await refreshed.authStore.useAuthStore.getState().hydrate();

    const state = refreshed.authStore.useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.session).toBeNull();
    expect(refreshed.session.loadSession()).toBeNull();
    expect(document.cookie).not.toContain("mfa_session=");
  });
});
