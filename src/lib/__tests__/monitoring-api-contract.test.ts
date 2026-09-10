/**
 * Integration test: Monitoring API cross-repo contract.
 *
 * The monitoring-api.ts module wraps apiClient to call backend endpoints.
 * This test verifies the URL construction and parameter forwarding contract
 * between frontend monitoring hooks and backend (reimagined-guide).
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

describe("Monitoring API contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("getMonitoringSummary calls /monitoring/summary with window param", async () => {
    const { getMonitoringSummary } = await import("@/lib/monitoring-api");
    await getMonitoringSummary("24h");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/monitoring/summary"),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("window=24h"),
      expect.any(Object)
    );
  });

  it("getMonitoringEvents forwards filter params", async () => {
    const { getMonitoringEvents } = await import("@/lib/monitoring-api");
    await getMonitoringEvents({
      status: "delivered",
      country: "FR",
      page: 1,
      page_size: 25,
    });

    const call = fetchMock.mock.calls[0];
    const url = call[0] as string;
    expect(url).toContain("/monitoring/events");
    expect(url).toContain("status=delivered");
    expect(url).toContain("country=FR");
    expect(url).toContain("page=1");
    expect(url).toContain("page_size=25");
  });

  it("getMonitoringTrace uses encoded messageId", async () => {
    const { getMonitoringTrace } = await import("@/lib/monitoring-api");
    await getMonitoringTrace("msg-123@misfits.fr");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("msg-123@misfits.fr")),
      expect.any(Object)
    );
  });

  it("getMonitoringBounces calls /monitoring/bounces", async () => {
    const { getMonitoringBounces } = await import("@/lib/monitoring-api");
    await getMonitoringBounces("7d");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/monitoring/bounces"),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("window=7d"),
      expect.any(Object)
    );
  });

  it("getMonitoringTopProviders calls /monitoring/providers/top", async () => {
    const { getMonitoringTopProviders } = await import("@/lib/monitoring-api");
    await getMonitoringTopProviders("7d");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/monitoring/providers/top"),
      expect.any(Object)
    );
  });

  it("getMonitoringActiveAlerts calls /monitoring/alerts/active", async () => {
    const { getMonitoringActiveAlerts } = await import("@/lib/monitoring-api");
    await getMonitoringActiveAlerts("24h");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/monitoring/alerts/active"),
      expect.any(Object)
    );
  });

  it("skips undefined/empty filter params", async () => {
    const { getMonitoringEvents } = await import("@/lib/monitoring-api");
    await getMonitoringEvents({ status: undefined, country: "" });

    const call = fetchMock.mock.calls[0];
    const url = call[0] as string;
    expect(url).not.toContain("status=");
    expect(url).not.toContain("country=");
  });
});
