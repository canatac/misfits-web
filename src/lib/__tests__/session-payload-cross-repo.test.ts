/**
 * Integration test: Session payload cross-repo contract.
 *
 * session-payload.ts normalizes snake_case backend (reimagined-guide) responses
 * into camelCase frontend Session type. This test verifies the normalization
 * contract so frontend never crashes on backend response shape changes.
 */
import { describe, it, expect } from "vitest";
import { parseSession, normalizeSession } from "@/lib/session-payload";
import type { Session } from "@/types/auth";

describe("Session payload cross-repo contract", () => {
  it("normalizes snake_case backend response to camelCase Session", () => {
    const backendResponse = {
      id: "sess-abc",
      user: {
        id: "user-1",
        email: "test@misfits.fr",
        role: "admin",
        two_factor_enabled: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      access_token: "token-123",
      refresh_token: "refresh-456",
      expires_at: Date.now() + 3600_000,
      refresh_expires_at: Date.now() + 86400_000,
      issued_at: Date.now(),
    };

    const normalized = normalizeSession(backendResponse) as Session;
    expect(normalized.accessToken).toBe("token-123");
    expect(normalized.refreshToken).toBe("refresh-456");
    expect(normalized.expiresAt).toBe(backendResponse.expires_at);
    expect(normalized.refreshExpiresAt).toBe(backendResponse.refresh_expires_at);
    expect(normalized.issuedAt).toBe(backendResponse.issued_at);
    expect(normalized.user.twoFactorEnabled).toBe(false);
    expect(normalized.user.createdAt).toBe("2026-01-01T00:00:00Z");
    expect(normalized.user.updatedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("parseSession returns valid Session for correct backend response", () => {
    const backendResponse = {
      id: "sess-xyz",
      user: {
        id: "user-2",
        email: "admin@misfits.ai",
        role: "admin",
        two_factor_enabled: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      access_token: "valid-token",
      refresh_token: "valid-refresh",
      expires_at: Date.now() + 3600_000,
      refresh_expires_at: Date.now() + 86400_000,
      issued_at: Date.now(),
    };

    const session = parseSession(backendResponse);
    expect(session).not.toBeNull();
    expect(session?.id).toBe("sess-xyz");
    expect(session?.user.email).toBe("admin@misfits.ai");
    expect(session?.user.role).toBe("admin");
  });

  it("parseSession returns null for invalid backend response (missing fields)", () => {
    const invalidResponse = {
      id: "",
      user: { id: "", email: "", role: "", two_factor_enabled: false },
      access_token: "",
      refresh_token: "",
      expires_at: "not-a-number",
      refresh_expires_at: 123,
      issued_at: 456,
    };

    const session = parseSession(invalidResponse);
    expect(session).toBeNull();
  });

  it("parseSession handles camelCase passthrough (frontend-initiated session)", () => {
    const camelCaseSession = {
      id: "sess-789",
      user: {
        id: "user-3",
        email: "frontend@misfits.fr",
        role: "user",
        twoFactorEnabled: false,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      accessToken: "already-camel",
      refreshToken: "already-camel-refresh",
      expiresAt: Date.now() + 3600_000,
      refreshExpiresAt: Date.now() + 86400_000,
      issuedAt: Date.now(),
    };

    const session = parseSession(camelCaseSession);
    expect(session).not.toBeNull();
    expect(session?.accessToken).toBe("already-camel");
  });

  it("backend response with null user returns null", () => {
    const brokenResponse = {
      id: "sess-broken",
      user: null,
      access_token: "token",
      refresh_token: "refresh",
      expires_at: 123,
      refresh_expires_at: 456,
      issued_at: 789,
    };

    expect(parseSession(brokenResponse)).toBeNull();
  });

  it("backend response with non-object returns null", () => {
    expect(parseSession("string")).toBeNull();
    expect(parseSession(123)).toBeNull();
    expect(parseSession(null)).toBeNull();
    expect(parseSession(undefined)).toBeNull();
  });

  it("parseSession handles origin field passthrough", () => {
    const withOrigin = {
      id: "sess-origin",
      user: {
        id: "user-4",
        email: "orig@misfits.fr",
        role: "user",
        two_factor_enabled: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      access_token: "tok",
      refresh_token: "ref",
      expires_at: Date.now() + 3600_000,
      refresh_expires_at: Date.now() + 86400_000,
      issued_at: Date.now(),
      origin: "127.0.0.1",
    };

    const session = parseSession(withOrigin);
    expect(session).not.toBeNull();
    expect((session as Session & { origin?: string }).origin).toBe("127.0.0.1");
  });
});
