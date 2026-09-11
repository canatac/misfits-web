/**
 * Session Management Contract Tests
 *
 * Cross-repo invariant: the frontend session must store/read/clear tokens
 * consistently. The backend (reimagined-guide) issues sessions with
 * expiresAt and refreshExpiresAt in epoch milliseconds; the session
 * module must correctly derive expiry, format remaining time, and
 * detect concurrent sessions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("session contract", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  const validSession = {
    id: "sess_abc123",
    accessToken: "at_123",
    refreshToken: "rt_456",
    expiresAt: Date.now() + 3_600_000,
    refreshExpiresAt: Date.now() + 86_400_000,
    issuedAt: Date.now(),
    user: {
      id: "user_42",
      email: "qa.free@misfits.fr",
      role: "user",
      twoFactorEnabled: false,
      createdAt: "2026-09-10T08:00:00Z",
      updatedAt: "2026-09-10T08:00:00Z",
    },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
    // Clear in-memory session state
    import("@/lib/session").then((m) => m.clearSession());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("storeSession and loadSession", () => {
    it("stores session in memory", async () => {
      const { storeSession, loadSession } = await import("@/lib/session");
      storeSession(validSession, false);
      const loaded = loadSession();
      expect(loaded).toEqual(validSession);
    });

    it("returns null when no session stored", async () => {
      const { loadSession } = await import("@/lib/session");
      expect(loadSession()).toBeNull();
    });

    it("clears session", async () => {
      const { storeSession, loadSession, clearSession } = await import(
        "@/lib/session"
      );
      storeSession(validSession, false);
      clearSession();
      expect(loadSession()).toBeNull();
    });

    it("clears session when refreshExpired", async () => {
      const { storeSession, loadSession } = await import("@/lib/session");
      const expiredSession = {
        ...validSession,
        refreshExpiresAt: Date.now() - 1000,
      };
      storeSession(expiredSession, false);
      expect(loadSession()).toBeNull();
    });
  });

  describe("getAccessToken and getRefreshToken", () => {
    it("returns access token when session valid", async () => {
      const { storeSession, getAccessToken } = await import("@/lib/session");
      storeSession(validSession, false);
      expect(getAccessToken()).toBe("at_123");
    });

    it("returns refresh token when session valid", async () => {
      const { storeSession, getRefreshToken } = await import("@/lib/session");
      storeSession(validSession, false);
      expect(getRefreshToken()).toBe("rt_456");
    });

    it("returns null when no session", async () => {
      const { getAccessToken, getRefreshToken } = await import(
        "@/lib/session"
      );
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  describe("isAccessTokenValid and isRefreshTokenValid", () => {
    it("returns true when access token not expired", async () => {
      const { isAccessTokenValid } = await import("@/lib/session");
      expect(isAccessTokenValid(validSession)).toBe(true);
    });

    it("returns false when access token expired", async () => {
      const { isAccessTokenValid } = await import("@/lib/session");
      const expired = { ...validSession, expiresAt: Date.now() - 1000 };
      expect(isAccessTokenValid(expired)).toBe(false);
    });

    it("returns true when refresh token not expired", async () => {
      const { isRefreshTokenValid } = await import("@/lib/session");
      expect(isRefreshTokenValid(validSession)).toBe(true);
    });

    it("returns false when refresh token expired", async () => {
      const { isRefreshTokenValid } = await import("@/lib/session");
      const expired = {
        ...validSession,
        refreshExpiresAt: Date.now() - 1000,
      };
      expect(isRefreshTokenValid(expired)).toBe(false);
    });

    it("accepts skew parameter for access token", async () => {
      const { isAccessTokenValid } = await import("@/lib/session");
      const almostExpired = {
        ...validSession,
        expiresAt: Date.now() + 5000,
      };
      expect(isAccessTokenValid(almostExpired)).toBe(true);
      expect(isAccessTokenValid(almostExpired, 10000)).toBe(false);
    });
  });

  describe("formatExpiry", () => {
    it("returns 'expired' for null session", async () => {
      const { formatExpiry } = await import("@/lib/session");
      expect(formatExpiry(null)).toBe("expired");
    });

    it("formats minutes and seconds", async () => {
      const { formatExpiry } = await import("@/lib/session");
      const session = {
        ...validSession,
        expiresAt: Date.now() + 252000, // 4m 12s
      };
      expect(formatExpiry(session)).toBe("4m 12s");
    });

    it("formats only seconds when < 1 minute", async () => {
      const { formatExpiry } = await import("@/lib/session");
      const session = {
        ...validSession,
        expiresAt: Date.now() + 30000, // 30s
      };
      expect(formatExpiry(session)).toBe("30s");
    });

    it("returns '0s' for expired", async () => {
      const { formatExpiry } = await import("@/lib/session");
      const session = {
        ...validSession,
        expiresAt: Date.now() - 1000,
      };
      expect(formatExpiry(session)).toBe("0s");
    });
  });

  describe("concurrent session detection", () => {
    it("detects concurrent session", async () => {
      const { recordSessionId, detectConcurrentSession } = await import(
        "@/lib/session"
      );
      recordSessionId("sess_old");
      expect(detectConcurrentSession("sess_new")).toBe(true);
    });

    it("returns false for same session id", async () => {
      const { recordSessionId, detectConcurrentSession } = await import(
        "@/lib/session"
      );
      recordSessionId("sess_same");
      expect(detectConcurrentSession("sess_same")).toBe(false);
    });

    it("returns false when no session recorded", async () => {
      const { detectConcurrentSession } = await import("@/lib/session");
      expect(detectConcurrentSession("sess_any")).toBe(false);
    });
  });

  describe("cookie management", () => {
    it("exports SESSION_COOKIE_NAME", async () => {
      const { SESSION_COOKIE_NAME } = await import("@/lib/session");
      expect(SESSION_COOKIE_NAME).toBe("mfa_session");
    });

    it("hasSessionCookie returns false when no cookie", async () => {
      const { hasSessionCookie } = await import("@/lib/session");
      expect(hasSessionCookie()).toBe(false);
    });
  });

  describe("OAuth handoff", () => {
    it("returns null when no pending OAuth provider", async () => {
      const { consumePendingOAuthProvider } = await import(
        "@/lib/session"
      );
      expect(consumePendingOAuthProvider()).toBeNull();
    });
  });
});
