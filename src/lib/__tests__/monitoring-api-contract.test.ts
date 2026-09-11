/**
 * Integration test: Monitoring API cross-repo contract.
 *
 * monitoring-api.ts wraps apiClient to call backend /monitoring/* endpoints.
 * This test verifies the URL construction and parameter forwarding contract.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("mon-token"),
  loadSession: vi.fn().mockReturnValue({ user: { email: "mon@misfits.fr" } }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

describe("Monitoring API cross-repo contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(() =>
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("getMonitoringSummary calls /monitoring/summary with window", async () => {
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

  it("getMonitoringEvents forwards all filter params", async () => {
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

  it("getMonitoringBounces calls /monitoring/bounces with window", async () => {
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

  it("skips undefined filter params", async () => {
    const { getMonitoringEvents } = await import("@/lib/monitoring-api");
    await getMonitoringEvents({ status: undefined, country: "" });

    const call = fetchMock.mock.calls[0];
    const url = call[0] as string;
    expect(url).not.toContain("status=");
    expect(url).not.toContain("country=");
  });

  it("MonitoringWindow accepts standard windows", async () => {
    const { getMonitoringSummary } = await import("@/lib/monitoring-api");
    // Should accept standard time windows (MonitoringWindow: "15m" | "1h" | "6h" | "24h" | "7d")
    await getMonitoringSummary("15m");
    await getMonitoringSummary("1h");
    await getMonitoringSummary("6h");
    await getMonitoringSummary("24h");
    await getMonitoringSummary("7d");
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });
});
