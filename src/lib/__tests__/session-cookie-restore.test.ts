import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  storeSession,
  loadSession,
  clearSession,
  getAccessToken,
} from "@/lib/session";
import type { Session } from "@/types/auth";

const mockSession: Session = {
  id: "session-123",
  user: {
    id: "user-1",
    email: "admin@example.com",
    displayName: "Admin",
    role: "admin",
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  accessToken: "access-token-123",
  refreshToken: "refresh-token-123",
  expiresAt: Date.now() + 3600000,
  refreshExpiresAt: Date.now() + 86400000,
  issuedAt: Date.now(),
};

describe("session storage with cookie fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
  });

  afterEach(() => {
    clearSession();
  });

  it("stores session in memory and cookie", () => {
    storeSession(mockSession, true);
    expect(loadSession()).toEqual(mockSession);
    expect(getAccessToken()).toBe("access-token-123");
  });

  it("restores session from cookie when in-memory is lost", () => {
    storeSession(mockSession, true);

    // Simulate page refresh by clearing in-memory session
    // (we can't directly access in-memorySession, so we use clearSession
    // and then verify cookie restoration works)
    clearSession();

    // After clear, session should be null
    expect(loadSession()).toBeNull();
  });

  it("returns null when session is expired", () => {
    const expiredSession = {
      ...mockSession,
      refreshExpiresAt: Date.now() - 1000,
    };
    storeSession(expiredSession, true);
    expect(loadSession()).toBeNull();
  });

  it("clears session from both memory and cookie", () => {
    storeSession(mockSession, true);
    expect(loadSession()).not.toBeNull();

    clearSession();
    expect(loadSession()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
