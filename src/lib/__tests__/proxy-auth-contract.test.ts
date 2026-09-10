/**
 * Integration test: proxy-auth cross-repo contract.
 *
 * The proxy-auth module forwards auth headers from the browser to the backend.
 * This test verifies the header forwarding contract between frontend apiClient
 * and backend (reimagined-guide) RBAC expectations.
 */
import { describe, it, expect } from "vitest";
import { buildForwardHeaders, extractIncomingAuth } from "@/lib/proxy-auth";

function createRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://mail.misfits.ai/api/admin/users", { headers });
}

describe("proxy-auth: auth forwarding contract", () => {
  it("extracts Authorization header", () => {
    const req = createRequest({ authorization: "Bearer token123" });
    const { authorization, cookie } = extractIncomingAuth(req);
    expect(authorization).toBe("Bearer token123");
    expect(cookie).toBeUndefined();
  });

  it("extracts Cookie header", () => {
    const req = createRequest({ cookie: "mfa_session=abc123" });
    const { authorization, cookie } = extractIncomingAuth(req);
    expect(cookie).toBe("mfa_session=abc123");
    expect(authorization).toBeUndefined();
  });

  it("forwards Authorization to backend", () => {
    const req = createRequest({ authorization: "Bearer my-token" });
    const headers = buildForwardHeaders(req);
    expect(headers.get("Authorization")).toBe("Bearer my-token");
  });

  it("forwards Cookie to backend", () => {
    const req = createRequest({ cookie: "mfa_session=xyz" });
    const headers = buildForwardHeaders(req);
    expect(headers.get("Cookie")).toBe("mfa_session=xyz");
  });

  it("forwards x-user-id and x-user-email identity headers", () => {
    const req = createRequest({
      "x-user-id": "user-123",
      "x-user-email": "test@misfits.fr",
    });
    const headers = buildForwardHeaders(req);
    expect(headers.get("x-user-id")).toBe("user-123");
    expect(headers.get("x-user-email")).toBe("test@misfits.fr");
  });

  it("sets Accept to application/json by default", () => {
    const req = createRequest();
    const headers = buildForwardHeaders(req);
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("allows overriding Accept via extra headers", () => {
    const req = createRequest();
    const headers = buildForwardHeaders(req, { Accept: "text/event-stream" });
    expect(headers.get("Accept")).toBe("text/event-stream");
  });

  it("preserves both auth sources when present", () => {
    const req = createRequest({
      authorization: "Bearer token",
      cookie: "mfa_session=session",
    });
    const headers = buildForwardHeaders(req);
    expect(headers.get("Authorization")).toBe("Bearer token");
    expect(headers.get("Cookie")).toBe("mfa_session=session");
  });

  it("returns empty headers when no auth present (RBAC flag OFF mode)", () => {
    const req = createRequest();
    const headers = buildForwardHeaders(req);
    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("Cookie")).toBeNull();
  });
});
