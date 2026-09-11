/**
 * Session Payload Contract Tests
 *
 * Verifies the contract between raw backend session payloads and the
 * normalized frontend Session shape. Cross-repo invariant: camelCase
 * mapping, field presence, and type guards must stay in sync with
 * the backend session serializer (reimagined-guide).
 */

import { describe, it, expect } from "vitest";
import {
  normalizeSession,
  isValidSession,
  parseSession,
} from "@/lib/session-payload";
import type { Session } from "@/types/auth";

describe("session-payload contract", () => {
  const validRaw = {
    id: "sess_abc123",
    access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9",
    refresh_token: "refresh_xyz789",
    expires_at: 1726051200,
    refresh_expires_at: 1726656000,
    issued_at: 1726047600,
    user: {
      id: "user_42",
      email: "qa.free@misfits.fr",
      role: "free",
      two_factor_enabled: false,
      created_at: "2026-09-10T08:00:00Z",
      updated_at: "2026-09-10T08:00:00Z",
    },
  };

  describe("normalizeSession", () => {
    it("converts snake_case keys to camelCase at top level", () => {
      const result = normalizeSession(validRaw);
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("expiresAt");
      expect(result).toHaveProperty("refreshExpiresAt");
      expect(result).toHaveProperty("issuedAt");
      expect(result).not.toHaveProperty("access_token");
      expect(result).not.toHaveProperty("refresh_token");
      expect(result).not.toHaveProperty("expires_at");
    });

    it("converts snake_case keys to camelCase in nested user object", () => {
      const result = normalizeSession(validRaw);
      expect(result.user).toHaveProperty("twoFactorEnabled");
      expect(result.user).not.toHaveProperty("two_factor_enabled");
    });

    it("preserves string and number values unchanged", () => {
      const result = normalizeSession(validRaw);
      expect(result.id).toBe("sess_abc123");
      expect(result.accessToken).toBe("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9");
      expect(result.refreshToken).toBe("refresh_xyz789");
      expect(result.expiresAt).toBe(1726051200);
      expect(result.user.id).toBe("user_42");
      expect(result.user.email).toBe("qa.free@misfits.fr");
    });

    it("handles deeply nested objects with camelCase conversion", () => {
      const raw = {
        id: "sess_deep",
        access_token: "at",
        refresh_token: "rt",
        expires_at: 1,
        refresh_expires_at: 2,
        issued_at: 3,
        user: {
          id: "u1",
          email: "a@b.com",
          role: "pro",
          two_factor_enabled: true,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          profile: {
            display_name: "Test User",
            avatar_url: "https://example.com/avatar.png",
          },
        },
      };
      const result = normalizeSession(raw);
      expect(result.user.profile).toHaveProperty("displayName");
      expect(result.user.profile).toHaveProperty("avatarUrl");
      expect(result.user.profile).not.toHaveProperty("display_name");
      expect(result.user.profile).not.toHaveProperty("avatar_url");
    });

    it("handles arrays by mapping each element", () => {
      const raw = {
        id: "sess_arr",
        access_token: "at",
        refresh_token: "rt",
        expires_at: 1,
        refresh_expires_at: 2,
        issued_at: 3,
        user: {
          id: "u1",
          email: "a@b.com",
          role: "admin",
          two_factor_enabled: false,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          tags: [{ tag_name: "vip" }, { tag_name: "beta" }],
        },
      };
      const result = normalizeSession(raw);
      expect(result.user.tags).toHaveLength(2);
      expect(result.user.tags[0]).toHaveProperty("tagName");
      expect(result.user.tags[1]).toHaveProperty("tagName");
    });
  });

  describe("isValidSession", () => {
    it("returns true for a valid normalized session", () => {
      const normalized = normalizeSession(validRaw);
      expect(isValidSession(normalized)).toBe(true);
    });

    it("returns false when id is empty string", () => {
      const normalized = { ...normalizeSession(validRaw), id: "" };
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when accessToken is empty string", () => {
      const normalized = { ...normalizeSession(validRaw), accessToken: "" };
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when refreshToken is empty string", () => {
      const normalized = { ...normalizeSession(validRaw), refreshToken: "" };
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when expiresAt is not finite", () => {
      const normalized = { ...normalizeSession(validRaw), expiresAt: NaN };
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when expiresAt is Infinity", () => {
      const normalized = {
        ...normalizeSession(validRaw),
        expiresAt: Infinity,
      };
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when user.id is empty", () => {
      const normalized = normalizeSession(validRaw);
      normalized.user.id = "";
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when user.email is empty", () => {
      const normalized = normalizeSession(validRaw);
      normalized.user.email = "";
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when user.role is empty", () => {
      const normalized = normalizeSession(validRaw);
      normalized.user.role = "";
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when user.twoFactorEnabled is not boolean", () => {
      const normalized = normalizeSession(validRaw);
      normalized.user.twoFactorEnabled = "true" as unknown as boolean;
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when user.createdAt is empty", () => {
      const normalized = normalizeSession(validRaw);
      normalized.user.createdAt = "";
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when user.updatedAt is empty", () => {
      const normalized = normalizeSession(validRaw);
      normalized.user.updatedAt = "";
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false for null input", () => {
      expect(isValidSession(null)).toBe(false);
    });

    it("returns false for undefined input", () => {
      expect(isValidSession(undefined)).toBe(false);
    });

    it("returns false for primitive input", () => {
      expect(isValidSession("string")).toBe(false);
      expect(isValidSession(123)).toBe(false);
    });

    it("returns false when user is missing", () => {
      const normalized = normalizeSession(validRaw);
      delete normalized.user;
      expect(isValidSession(normalized)).toBe(false);
    });

    it("returns false when user is null", () => {
      const normalized = normalizeSession(validRaw);
      normalized.user = null;
      expect(isValidSession(normalized)).toBe(false);
    });
  });

  describe("parseSession", () => {
    it("returns Session for valid raw payload", () => {
      const result = parseSession(validRaw);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("user");
    });

    it("returns null for invalid payload (missing fields)", () => {
      const invalidRaw = { id: "sess_x" };
      expect(parseSession(invalidRaw)).toBeNull();
    });

    it("returns null for null input", () => {
      expect(parseSession(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(parseSession(undefined)).toBeNull();
    });

    it("returns null for primitive input", () => {
      expect(parseSession("not an object")).toBeNull();
      expect(parseSession(42)).toBeNull();
    });

    it("returns null for array input", () => {
      expect(parseSession([1, 2, 3])).toBeNull();
    });

    it("returns null when user object is malformed", () => {
      const raw = {
        id: "sess_x",
        access_token: "at",
        refresh_token: "rt",
        expires_at: 1,
        refresh_expires_at: 2,
        issued_at: 3,
        user: "not-an-object",
      };
      expect(parseSession(raw)).toBeNull();
    });
  });

  describe("cross-repo invariants", () => {
    it("accepts real-world backend payload shape with snake_case", () => {
      const backendPayload = {
        id: "sess_live_001",
        access_token: "live_access_token_value",
        refresh_token: "live_refresh_token_value",
        expires_at: 1726137600,
        refresh_expires_at: 1726742400,
        issued_at: 1726134000,
        user: {
          id: "user_live_1",
          email: "jan.atac@misfits.fr",
          role: "admin",
          two_factor_enabled: true,
          created_at: "2026-08-15T10:30:00Z",
          updated_at: "2026-09-10T14:22:00Z",
        },
      };
      const result = parseSession(backendPayload);
      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe("live_access_token_value");
      expect(result?.user.email).toBe("jan.atac@misfits.fr");
      expect(result?.user.twoFactorEnabled).toBe(true);
    });

    it("rejects payload with wrong types (string instead of number for expires_at)", () => {
      const badRaw = {
        ...validRaw,
        expires_at: "1726051200",
      };
      expect(parseSession(badRaw)).toBeNull();
    });

    it("rejects payload with wrong types (number instead of boolean for two_factor_enabled)", () => {
      const badRaw = {
        ...validRaw,
        user: {
          ...validRaw.user,
          two_factor_enabled: 1,
        },
      };
      expect(parseSession(badRaw)).toBeNull();
    });
  });
});
