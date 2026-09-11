/**
 * Mail API Contract Tests
 *
 * Cross-repo invariant: the frontend mail-api helpers must produce headers
 * that match the backend email-api (reimagined-guide) expectations:
 * - x-user-id = local-part of the user email (Mongo convention)
 * - x-user-email = full email address
 * - Authorization: Bearer <token> when session exists
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const mockGetAccessToken = vi.fn();
const mockLoadSession = vi.fn();

vi.mock("@/lib/session", () => ({
  getAccessToken: () => mockGetAccessToken(),
  loadSession: () => mockLoadSession(),
}));

describe("mail-api contract", () => {
  beforeEach(() => {
    mockGetAccessToken.mockReset();
    mockLoadSession.mockReset();
  });

  describe("getMailUserId", () => {
    it("returns local-part when email contains @", async () => {
      const { getMailUserId } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({
        user: { email: "admin@misfits.ai" },
      });
      expect(getMailUserId()).toBe("admin");
    });

    it("returns full email when no @ present", async () => {
      const { getMailUserId } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({ user: { email: "admin" } });
      expect(getMailUserId()).toBe("admin");
    });

    it("returns null when no session", async () => {
      const { getMailUserId } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      expect(getMailUserId()).toBeNull();
    });

    it("returns null when session has no user", async () => {
      const { getMailUserId } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({});
      expect(getMailUserId()).toBeNull();
    });

    it("returns null when email is empty", async () => {
      const { getMailUserId } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({ user: { email: "" } });
      expect(getMailUserId()).toBeNull();
    });

    it("returns null when email is whitespace only", async () => {
      const { getMailUserId } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({ user: { email: "   " } });
      expect(getMailUserId()).toBeNull();
    });

    it("trims whitespace from email", async () => {
      const { getMailUserId } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({
        user: { email: "  admin@misfits.ai  " },
      });
      expect(getMailUserId()).toBe("admin");
    });
  });

  describe("hasMailIdentity", () => {
    it("returns true when email present", async () => {
      const { hasMailIdentity } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({
        user: { email: "qa.free@misfits.fr" },
      });
      expect(hasMailIdentity()).toBe(true);
    });

    it("returns false when no session", async () => {
      const { hasMailIdentity } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      expect(hasMailIdentity()).toBe(false);
    });

    it("returns false when email is empty", async () => {
      const { hasMailIdentity } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({ user: { email: "" } });
      expect(hasMailIdentity()).toBe(false);
    });

    it("returns false when email is whitespace", async () => {
      const { hasMailIdentity } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({ user: { email: "   " } });
      expect(hasMailIdentity()).toBe(false);
    });
  });

  describe("mailAuthHeaders", () => {
    it("sets Content-Type to application/json", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      mockGetAccessToken.mockReturnValue(null);
      const headers = mailAuthHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("sets x-user-id to local-part of email", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({
        user: { email: "qa.admin@misfits.fr" },
      });
      mockGetAccessToken.mockReturnValue(null);
      const headers = mailAuthHeaders();
      expect(headers["x-user-id"]).toBe("qa.admin");
    });

    it("sets x-user-email to full email", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({
        user: { email: "qa.pro@misfits.fr" },
      });
      mockGetAccessToken.mockReturnValue(null);
      const headers = mailAuthHeaders();
      expect(headers["x-user-email"]).toBe("qa.pro@misfits.fr");
    });

    it("sets Authorization Bearer when token present", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      mockGetAccessToken.mockReturnValue("my_token_123");
      const headers = mailAuthHeaders();
      expect(headers.Authorization).toBe("Bearer my_token_123");
    });

    it("omits x-user-id when no email", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      mockGetAccessToken.mockReturnValue(null);
      const headers = mailAuthHeaders();
      expect(headers).not.toHaveProperty("x-user-id");
    });

    it("omits x-user-email when no email", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      mockGetAccessToken.mockReturnValue(null);
      const headers = mailAuthHeaders();
      expect(headers).not.toHaveProperty("x-user-email");
    });

    it("omits Authorization when no token", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      mockGetAccessToken.mockReturnValue(null);
      const headers = mailAuthHeaders();
      expect(headers).not.toHaveProperty("Authorization");
    });

    it("merges extra headers", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue(null);
      mockGetAccessToken.mockReturnValue(null);
      const headers = mailAuthHeaders({ "X-Custom": "value" });
      expect(headers["X-Custom"]).toBe("value");
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("all three auth fields present with full session", async () => {
      const { mailAuthHeaders } = await import("@/lib/mail-api");
      mockLoadSession.mockReturnValue({
        user: { email: "admin@misfits.ai" },
      });
      mockGetAccessToken.mockReturnValue("token_admin");
      const headers = mailAuthHeaders();
      expect(headers["x-user-id"]).toBe("admin");
      expect(headers["x-user-email"]).toBe("admin@misfits.ai");
      expect(headers.Authorization).toBe("Bearer token_admin");
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });
});
