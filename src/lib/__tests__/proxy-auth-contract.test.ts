/**
 * Proxy Auth Contract Tests
 *
 * Cross-repo invariant: the frontend /api/admin/* proxy must forward
 * authentication signals (Authorization, Cookie, x-user-id, x-user-email)
 * to the backend (reimagined-guide) so RBAC enforcement works correctly.
 */

import { describe, it, expect } from "vitest";
import {
  extractIncomingAuth,
  buildForwardHeaders,
} from "@/lib/proxy-auth";

describe("proxy-auth contract", () => {
  describe("extractIncomingAuth", () => {
    it("extracts authorization header", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer token123" },
      });
      const result = extractIncomingAuth(request);
      expect(result.authorization).toBe("Bearer token123");
    });

    it("extracts cookie header", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { Cookie: "mfa_session=abc123" },
      });
      const result = extractIncomingAuth(request);
      expect(result.cookie).toBe("mfa_session=abc123");
    });

    it("returns undefined for missing headers", () => {
      const request = new Request("http://localhost/api/test");
      const result = extractIncomingAuth(request);
      expect(result.authorization).toBeUndefined();
      expect(result.cookie).toBeUndefined();
    });

    it("extracts both headers when present", () => {
      const request = new Request("http://localhost/api/test", {
        headers: {
          Authorization: "Bearer token123",
          Cookie: "mfa_session=abc123",
        },
      });
      const result = extractIncomingAuth(request);
      expect(result.authorization).toBe("Bearer token123");
      expect(result.cookie).toBe("mfa_session=abc123");
    });
  });

  describe("buildForwardHeaders", () => {
    it("sets Accept to application/json by default", () => {
      const request = new Request("http://localhost/api/test");
      const headers = buildForwardHeaders(request);
      expect(headers.get("Accept")).toBe("application/json");
    });

    it("forwards Authorization header", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer token123" },
      });
      const headers = buildForwardHeaders(request);
      expect(headers.get("Authorization")).toBe("Bearer token123");
    });

    it("forwards Cookie header", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { Cookie: "mfa_session=abc123" },
      });
      const headers = buildForwardHeaders(request);
      expect(headers.get("Cookie")).toBe("mfa_session=abc123");
    });

    it("forwards x-user-id header", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { "x-user-id": "admin" },
      });
      const headers = buildForwardHeaders(request);
      expect(headers.get("x-user-id")).toBe("admin");
    });

    it("forwards x-user-email header", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { "x-user-email": "admin@misfits.ai" },
      });
      const headers = buildForwardHeaders(request);
      expect(headers.get("x-user-email")).toBe("admin@misfits.ai");
    });

    it("does not set x-user-id when not present", () => {
      const request = new Request("http://localhost/api/test");
      const headers = buildForwardHeaders(request);
      expect(headers.get("x-user-id")).toBeNull();
    });

    it("does not set x-user-email when not present", () => {
      const request = new Request("http://localhost/api/test");
      const headers = buildForwardHeaders(request);
      expect(headers.get("x-user-email")).toBeNull();
    });

    it("merges extra headers", () => {
      const request = new Request("http://localhost/api/test");
      const headers = buildForwardHeaders(request, {
        "X-Custom": "value",
      });
      expect(headers.get("X-Custom")).toBe("value");
      expect(headers.get("Accept")).toBe("application/json");
    });

    it("preserves Accept from extra headers", () => {
      const request = new Request("http://localhost/api/test");
      const headers = buildForwardHeaders(request, {
        Accept: "text/html",
      });
      expect(headers.get("Accept")).toBe("text/html");
    });

    it("forwards all headers together", () => {
      const request = new Request("http://localhost/api/test", {
        headers: {
          Authorization: "Bearer token123",
          Cookie: "mfa_session=abc",
          "x-user-id": "admin",
          "x-user-email": "admin@misfits.ai",
        },
      });
      const headers = buildForwardHeaders(request);
      expect(headers.get("Authorization")).toBe("Bearer token123");
      expect(headers.get("Cookie")).toBe("mfa_session=abc");
      expect(headers.get("x-user-id")).toBe("admin");
      expect(headers.get("x-user-email")).toBe("admin@misfits.ai");
      expect(headers.get("Accept")).toBe("application/json");
    });

    it("handles empty extra headers", () => {
      const request = new Request("http://localhost/api/test");
      const headers = buildForwardHeaders(request, {});
      expect(headers.get("Accept")).toBe("application/json");
    });
  });
});
