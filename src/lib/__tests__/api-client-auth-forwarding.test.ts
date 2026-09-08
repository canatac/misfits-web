import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("@/lib/session", () => ({
  getAccessToken: () => "token-123",
  getRefreshToken: () => null,
  loadSession: () => ({ user: { email: "admin@misfits.ai" } }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { apiClient } from "@/lib/api-client";

describe("api-client auth forwarding", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("sends credentials+auth headers for /api admin proxies", async () => {
    await apiClient.post("/admin/users", { email: "new@misfits.ai" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/users");
    expect(init.credentials).toBe("include");

    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("x-user-email")).toBe("admin@misfits.ai");
    expect(headers.get("x-user-id")).toBe("admin");
  });
});
