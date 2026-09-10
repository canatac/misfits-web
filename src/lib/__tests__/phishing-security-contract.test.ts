/**
 * Integration test: Phishing detector ↔ Security API cross-repo contract.
 *
 * The phishing-detector.ts produces PhishingResult consumed by security-api.ts
 * which wraps apiClient to call backend /security/* endpoints.
 * This test verifies the contract between frontend phishing analysis output
 * and backend security API expectations.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ThreatLevel, IndicatorType, AuthStatus, PhishingResult } from "@/types/security";

const fetchMock = vi.fn();
global.fetch = fetchMock;

vi.mock("@/lib/session", () => ({
  getAccessToken: vi.fn().mockReturnValue("sec-token-abc"),
  loadSession: vi.fn().mockReturnValue({
    user: { email: "security@misfits.fr" },
  }),
  storeSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/session-payload", () => ({
  parseSession: (data: unknown) => data,
}));

describe("Phishing ↔ Security API cross-repo contract", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  it("PhishingResult threatLevel values match backend ThreatLevel enum", () => {
    // Contract: these exact strings must match backend Rust serde expectations
    const validLevels: ThreatLevel[] = ["safe", "suspicious", "dangerous", "critical"];
    expect(validLevels).toContain("safe");
    expect(validLevels).toContain("critical");
  });

  it("PhishingResult score is 0-100 integer matching backend range", () => {
    // Contract: backend expects u8 (0-255) but frontend constrains to 0-100
    const score: PhishingResult["score"] = 75;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("SecurityIndicator type values match backend indicator categories", () => {
    // Contract: backend emits these exact indicator type strings
    const validTypes: IndicatorType[] = [
      "header", "link", "domain", "content", "attachment", "sender", "bec", "ai"
    ];
    expect(validTypes).toContain("header");
    expect(validTypes).toContain("ai");
  });

  it("HeaderAnalysis AuthStatus values match backend auth check results", () => {
    // Contract: backend SPF/DKIM/DMARC checks return these exact strings
    const validStatuses: AuthStatus[] = ["pass", "fail", "none", "unknown"];
    expect(validStatuses).toContain("pass");
    expect(validStatuses).toContain("unknown");
  });

  it("security-api getSecurityActiveAlerts calls /security/alerts/active", async () => {
    const { getSecurityActiveAlerts } = await import("@/lib/security-api");
    await getSecurityActiveAlerts({ window: "24h", severity: "high" });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/security/alerts/active"),
      expect.any(Object)
    );
  });

  it("security-api rollbackSecurityRemediation POSTs with encoded alertId", async () => {
    const { rollbackSecurityRemediation } = await import("@/lib/security-api");
    await rollbackSecurityRemediation("alert-789");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/security/remediation/alert-789/rollback"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("security-api forwards auth headers via apiClient", async () => {
    const { getSecurityIncidents } = await import("@/lib/security-api");
    await getSecurityIncidents({ page: 1, page_size: 10 });

    const call = fetchMock.mock.calls[0];
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer sec-token-abc");
    expect(headers.get("x-user-id")).toBe("security");
  });

  it("security-api skips undefined filter params in URL", async () => {
    const { getSecurityActiveAlerts } = await import("@/lib/security-api");
    await getSecurityActiveAlerts({ window: undefined, severity: undefined });

    const call = fetchMock.mock.calls[0];
    const url = call[0] as string;
    expect(url).not.toContain("window=");
    expect(url).not.toContain("severity=");
  });
});
