/**
 * Integration test: Security API cross-repo contract.
 *
 * The security-api.ts module wraps apiClient to call backend security endpoints.
 * This test verifies URL construction and parameter forwarding.
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

describe("Security API contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("getSecurityActiveAlerts calls /security/alerts/active with filters", async () => {
    const { getSecurityActiveAlerts } = await import("@/lib/security-api");
    await getSecurityActiveAlerts({ window: "24h", severity: "high" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/security/alerts/active"),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("window=24h"),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("severity=high"),
      expect.any(Object)
    );
  });

  it("getSecurityIncidents forwards pagination and filters", async () => {
    const { getSecurityIncidents } = await import("@/lib/security-api");
    await getSecurityIncidents({ page: 2, page_size: 10, severity: "critical" });

    const call = fetchMock.mock.calls[0];
    const url = call[0] as string;
    expect(url).toContain("/security/incidents");
    expect(url).toContain("page=2");
    expect(url).toContain("page_size=10");
    expect(url).toContain("severity=critical");
  });

  it("getSecurityTenantStatus uses encoded tenantId", async () => {
    const { getSecurityTenantStatus } = await import("@/lib/security-api");
    await getSecurityTenantStatus("tenant-123");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/security/tenant/tenant-123/status"),
      expect.any(Object)
    );
  });

  it("rollbackSecurityRemediation uses POST with encoded alertId", async () => {
    const { rollbackSecurityRemediation } = await import("@/lib/security-api");
    await rollbackSecurityRemediation("alert-456");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/security/remediation/alert-456/rollback"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("skips undefined filter params", async () => {
    const { getSecurityActiveAlerts } = await import("@/lib/security-api");
    await getSecurityActiveAlerts({ window: undefined, severity: undefined });

    const call = fetchMock.mock.calls[0];
    const url = call[0] as string;
    expect(url).not.toContain("window=");
    expect(url).not.toContain("severity=");
  });
});
