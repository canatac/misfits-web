/**
 * Integration test: Admin ops API cross-repo contract.
 *
 * Cross-repo contract: admin-ops-api.ts wraps apiClient to call backend
 * admin endpoints for user management, change requests, and audit logging.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  loadSession: vi.fn().mockReturnValue({ user: { email: "test@misfits.fr" } }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

describe("Admin ops API contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("getAdminUsers GETs /admin/users", async () => {
    const { getAdminUsers } = await import("@/lib/admin-ops-api");
    await getAdminUsers();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/users"),
      expect.any(Object)
    );
  });

  it("getAdminWhoami GETs /admin/whoami", async () => {
    const { getAdminWhoami } = await import("@/lib/admin-ops-api");
    await getAdminWhoami();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/whoami"),
      expect.any(Object)
    );
  });

  it("getChangeRequests GETs /admin/change-requests", async () => {
    const { getChangeRequests } = await import("@/lib/admin-ops-api");
    await getChangeRequests();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/change-requests"),
      expect.any(Object)
    );
  });

  it("createAdminChangeRequest POSTs to /admin/change-requests", async () => {
    const { createAdminChangeRequest } = await import("@/lib/admin-ops-api");
    await createAdminChangeRequest({
      title: "Test CR",
      problem: "Problem",
      desiredOutcome: "Outcome",
      scope: "ux",
      urgency: "high",
      impact: "medium",
      requestedBy: "user-1",
      linkedRepo: "misfits-web",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/change-requests"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("transitionAdminChangeRequest PATCHes /admin/change-requests/{id}", async () => {
    const { transitionAdminChangeRequest } = await import("@/lib/admin-ops-api");
    await transitionAdminChangeRequest({ id: "cr-1", action: "advance" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/change-requests/cr-1"),
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("deleteAdminChangeRequest DELETEs /admin/change-requests/{id}", async () => {
    const { deleteAdminChangeRequest } = await import("@/lib/admin-ops-api");
    await deleteAdminChangeRequest("cr-2");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/change-requests/cr-2"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("inviteAdminUser POSTs to /admin/users/{id}/invite", async () => {
    const { inviteAdminUser } = await import("@/lib/admin-ops-api");
    await inviteAdminUser("user-1");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/users/user-1/invite"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("resetAdminPassword POSTs to /admin/users/{id}/reset-password", async () => {
    const { resetAdminPassword } = await import("@/lib/admin-ops-api");
    await resetAdminPassword("user-2");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/users/user-2/reset-password"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("getAdminAiActivity GETs /admin/ai-activity with limit", async () => {
    const { getAdminAiActivity } = await import("@/lib/admin-ops-api");
    await getAdminAiActivity(20);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/ai-activity"),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("limit=20"),
      expect.any(Object)
    );
  });

  it("getAdminAuditLog forwards query params", async () => {
    const { getAdminAuditLog } = await import("@/lib/admin-ops-api");
    await getAdminAuditLog({ target: "user-1", action: "create", limit: 10 });

    const call = fetchMock.mock.calls[0];
    const url = call[0] as string;
    expect(url).toContain("/admin/audit-log");
    expect(url).toContain("target=user-1");
    expect(url).toContain("action=create");
    expect(url).toContain("limit=10");
  });
});
