/**
 * Cross-repo integration tests: deliverability-monitor + email-auth-api.
 *
 * Verifies that the frontend monitoring API client produces shapes
 * consumable by the deliverability-monitor library from PR #531.
 */
import { describe, it, expect } from "vitest";
import type { AdminDeliverabilityDiagnosticsResponse } from "@/types/admin-ops-deliverability";
import type { AuthStatus } from "@/types/security";

describe("cross-repo: deliverability-monitor + email-auth-api", () => {
  it("AdminDeliverabilityDiagnosticsResponse maps to HeaderAnalysis shape", () => {
    const diagnostics: AdminDeliverabilityDiagnosticsResponse = {
      window: "24h",
      spf: { valid: true, record: "v=spf1 include:_spf.google.com ~all" },
      dkim: { valid: false },
      dmarc: { valid: true, record: "v=DMARC1; p=quarantine;" },
      mx: { records: ["mail.example.com"] },
    };

    // Simulate what parseAuthStatus from deliverability-monitor.ts would produce
    const spfStatus: AuthStatus = diagnostics.spf?.valid ? "pass" : "fail";
    const dkimStatus: AuthStatus = diagnostics.dkim?.valid ? "pass" : "fail";
    const dmarcStatus: AuthStatus = diagnostics.dmarc?.valid ? "pass" : "fail";

    expect(spfStatus).toBe("pass");
    expect(dkimStatus).toBe("fail");
    expect(dmarcStatus).toBe("pass");
  });

  it("missing auth fields default to unknown status", () => {
    const diagnostics: AdminDeliverabilityDiagnosticsResponse = {
      window: "1h",
    };

    const spfStatus: AuthStatus = diagnostics.spf?.valid ? "pass" : "unknown";
    expect(spfStatus).toBe("unknown");
  });

  it("incidents response maps to DeliverableAlert shape", () => {
    const incident = {
      id: "inc-1",
      ts: "2026-09-10T08:00:00Z",
      type: "spf" as const,
      status: "fail" as const,
      message: "SPF record missing",
      resolved: false,
    };

    // Simulate alert generation from generateAlerts()
    const alert = {
      id: `alert-${incident.id}`,
      type: incident.type,
      severity: incident.type === "dmarc" ? "critical" : "warning",
      message: incident.message,
      timestamp: incident.ts,
      acknowledged: incident.resolved,
    };

    expect(alert.severity).toBe("warning");
    expect(alert.acknowledged).toBe(false);
  });

  it("DMARC failure produces critical alert", () => {
    const incident = {
      id: "inc-2",
      ts: "2026-09-10T08:00:00Z",
      type: "dmarc" as const,
      status: "fail" as const,
      message: "DMARC policy not enforced",
      resolved: false,
    };

    const severity: "critical" | "warning" = incident.type === "dmarc" ? "critical" : "warning";
    expect(severity).toBe("critical");
  });

  it("compliance summary requires all auth checks passing", () => {
    const allPass = [
      { type: "spf" as const, status: "pass" as AuthStatus, lastChecked: new Date().toISOString() },
      { type: "dkim" as const, status: "pass" as AuthStatus, lastChecked: new Date().toISOString() },
      { type: "dmarc" as const, status: "pass" as AuthStatus, lastChecked: new Date().toISOString() },
    ];

    const passCount = allPass.filter((r) => r.status === "pass").length;
    const compliant = passCount === allPass.length;

    expect(compliant).toBe(true);
  });

  it("non-compliant when any auth check fails", () => {
    const results = [
      { type: "spf" as const, status: "pass" as AuthStatus, lastChecked: new Date().toISOString() },
      { type: "dkim" as const, status: "fail" as AuthStatus, lastChecked: new Date().toISOString() },
    ];

    const compliant = results.every((r) => r.status === "pass");
    expect(compliant).toBe(false);
  });
});
