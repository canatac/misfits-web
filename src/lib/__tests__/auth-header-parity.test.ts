/**
 * Integration test: Auth header parity between apiClient and mailAuthHeaders.
 *
 * Cross-repo contract: apiClient (api-client.ts) and mailAuthHeaders (mail-api.ts)
 * both inject Authorization + identity headers. They MUST produce identical values
 * for the same session, otherwise backend RBAC sees inconsistent identity signals.
 *
 * This test guards against drift between the two auth injection strategies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("parity-token-abc"),
  loadSession: vi.fn().mockReturnValue({
    user: { email: "parity@misfits.fr" },
  }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

describe("Auth header parity: apiClient vs mailAuthHeaders", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("apiClient and mailAuthHeaders produce identical Authorization header", async () => {
    const { apiClient } = await import("@/lib/api-client");
    const { mailAuthHeaders } = await import("@/lib/mail-api");

    await apiClient.get("/test-parity");

    const fetchHeaders = fetchMock.mock.calls[0]![1] as RequestInit;
    const apiClientAuth = (fetchHeaders.headers as Headers).get("Authorization");

    const mailHeaders = mailAuthHeaders();

    expect(apiClientAuth).toBe(mailHeaders["Authorization"]);
    expect(apiClientAuth).toBe("Bearer parity-token-abc");
  });

  it("apiClient and mailAuthHeaders produce identical x-user-id", async () => {
    const { apiClient } = await import("@/lib/api-client");
    const { mailAuthHeaders } = await import("@/lib/mail-api");

    await apiClient.get("/test-parity");

    const fetchHeaders = fetchMock.mock.calls[0]![1] as RequestInit;
    const apiClientUserId = (fetchHeaders.headers as Headers).get("x-user-id");

    const mailHeaders = mailAuthHeaders();

    expect(apiClientUserId).toBe(mailHeaders["x-user-id"]);
    expect(apiClientUserId).toBe("parity"); // local-part only
  });

  it("apiClient and mailAuthHeaders produce identical x-user-email", async () => {
    const { apiClient } = await import("@/lib/api-client");
    const { mailAuthHeaders } = await import("@/lib/mail-api");

    await apiClient.get("/test-parity");

    const fetchHeaders = fetchMock.mock.calls[0]![1] as RequestInit;
    const apiClientEmail = (fetchHeaders.headers as Headers).get("x-user-email");

    const mailHeaders = mailAuthHeaders();

    expect(apiClientEmail).toBe(mailHeaders["x-user-email"]);
    expect(apiClientEmail).toBe("parity@misfits.fr");
  });

  it("both strategies set Content-Type application/json for POST with body", async () => {
    const { apiClient } = await import("@/lib/api-client");
    const { mailAuthHeaders } = await import("@/lib/mail-api");

    await apiClient.post("/test-parity", { data: "value" });

    const fetchHeaders = fetchMock.mock.calls[0]![1] as RequestInit;
    const apiClientContentType = (fetchHeaders.headers as Headers).get("Content-Type");

    const mailHeaders = mailAuthHeaders();

    expect(apiClientContentType).toBe("application/json");
    expect(mailHeaders["Content-Type"]).toBe("application/json");
  });

  it("both strategies use credentials: include for browser requests", async () => {
    const { apiClient } = await import("@/lib/api-client");

    await apiClient.get("/test-parity");

    const fetchInit = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(fetchInit.credentials).toBe("include");
  });

  it("apiClient x-user-id uses local-part (split @ [0]) matching mailAuthHeaders", async () => {
    const { apiClient } = await import("@/lib/api-client");

    await apiClient.get("/test-parity");

    const fetchHeaders = fetchMock.mock.calls[0]![1] as RequestInit;
    const apiClientUserId = (fetchHeaders.headers as Headers).get("x-user-id");

    // Critical: backend expects local-part only, not full email
    expect(apiClientUserId).not.toContain("@");
    expect(apiClientUserId).toBe("parity");
  });
});
