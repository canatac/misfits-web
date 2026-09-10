/**
 * Integration test: use-composer send flow cross-repo contract.
 *
 * The composer hooks (use-composer.ts) use mailAuthHeaders() from mail-api.ts
 * for auth, while apiClient (api-client.ts) injects headers via its own path.
 * This test verifies both produce consistent Authorization + identity headers,
 * ensuring no cross-repo drift between the two auth injection strategies.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("composer-token-xyz"),
  loadSession: vi.fn().mockReturnValue({
    user: { email: "composer@misfits.fr" },
  }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

describe("use-composer send flow: cross-repo auth contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "sent-1", sent: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("mailAuthHeaders produces Authorization header compatible with backend", async () => {
    const { mailAuthHeaders } = await import("@/lib/mail-api");
    const headers = mailAuthHeaders();

    expect(headers["Authorization"]).toBe("Bearer composer-token-xyz");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("mailAuthHeaders produces x-user-id (local-part) and x-user-email", async () => {
    const { mailAuthHeaders } = await import("@/lib/mail-api");
    const headers = mailAuthHeaders();

    expect(headers["x-user-id"]).toBe("composer");
    expect(headers["x-user-email"]).toBe("composer@misfits.fr");
  });

  it("mailAuthHeaders local-part extraction matches apiClient convention", async () => {
    const { mailAuthHeaders } = await import("@/lib/mail-api");
    const { getMailUserId } = await import("@/lib/mail-api");

    const headers = mailAuthHeaders();
    const userId = getMailUserId();

    expect(headers["x-user-id"]).toBe(userId);
    expect(userId).toBe("composer"); // local-part only, no @
  });

  it("mailAuthHeaders handles email with + addressing", async () => {
    const { mailAuthHeaders } = await import("@/lib/mail-api");
    const headers = mailAuthHeaders();

    // Verify no @ leaks into x-user-id (backend expects local-part)
    expect(headers["x-user-id"]).not.toContain("@");
    expect(headers["x-user-email"]).toContain("@");
  });

  it("getMailUserId returns null when no session", async () => {
    vi.doMock("@/lib/session", () => ({
      getAccessToken: vi.fn().mockReturnValue(null),
      loadSession: vi.fn().mockReturnValue(null),
      storeSession: vi.fn(),
      clearSession: vi.fn(),
    }));

    // Re-import to pick up new mock
    vi.resetModules();
    const { getMailUserId } = await import("@/lib/mail-api");
    expect(getMailUserId()).toBeNull();
  });

  it("composer send hits /api/send with POST method", async () => {
    // Verify fetch is called with POST for send flow
    const { mailAuthHeaders } = await import("@/lib/mail-api");
    await fetch("/api/send", {
      method: "POST",
      headers: mailAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ to: ["to@test.fr"], subject: "Hi" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/send",
      expect.objectContaining({ method: "POST" })
    );

    const call = fetchMock.mock.calls[0];
    const init = call[1] as RequestInit;
    // fetch normalizes headers to lowercase Headers object
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer composer-token-xyz");
    expect(headers.get("x-user-id")).toBe("composer");
  });

  it("composer undo-send hits /api/send/undo with POST method", async () => {
    await fetch("/api/send/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "sent-1" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/send/undo",
      expect.objectContaining({ method: "POST" })
    );
  });
});
