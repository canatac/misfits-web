/**
 * Email authentication monitoring — DKIM/SPF/DMARC status tracking.
 *
 * Tracks authentication results over time, detects failures,
 * and generates alerts for deliverability issues.
 */

import type { AdminDeliverabilityDiagnosticsResponse } from "@/types/admin-ops-deliverability";

export type AuthCheckType = "spf" | "dkim" | "dmarc" | "mx";
export type AuthStatus = "pass" | "fail" | "none" | "unknown";

export interface AuthCheckResult {
  type: AuthCheckType;
  status: AuthStatus;
  details?: string;
  lastChecked: string;
}

export interface DeliverabilityAlert {
  id: string;
  type: AuthCheckType;
  severity: "warning" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface DeliverabilityStats {
  totalChecks: number;
  passCount: number;
  failCount: number;
  noneCount: number;
  passRate: number;
  lastCheck: string | null;
  alerts: DeliverabilityAlert[];
}

/**
 * Parse authentication status from diagnostics response.
 */
export function parseAuthStatus(
  diagnostics: AdminDeliverabilityDiagnosticsResponse
): AuthCheckResult[] {
  const results: AuthCheckResult[] = [];
  const now = new Date().toISOString();

  if (diagnostics.spf) {
    results.push({
      type: "spf",
      status: diagnostics.spf.valid ? "pass" : "fail",
      details: diagnostics.spf.record,
      lastChecked: now,
    });
  }

  if (diagnostics.dkim) {
    results.push({
      type: "dkim",
      status: diagnostics.dkim.valid ? "pass" : "fail",
      details: diagnostics.dkim.domains?.join(", "),
      lastChecked: now,
    });
  }

  if (diagnostics.dmarc) {
    results.push({
      type: "dmarc",
      status: diagnostics.dmarc.valid ? "pass" : "fail",
      details: diagnostics.dmarc.record,
      lastChecked: now,
    });
  }

  if (diagnostics.mx) {
    results.push({
      type: "mx",
      status: diagnostics.mx.records && diagnostics.mx.records.length > 0 ? "pass" : "none",
      details: diagnostics.mx.records?.join(", "),
      lastChecked: now,
    });
  }

  return results;
}

/**
 * Generate alerts for failed authentication checks.
 */
export function generateAlerts(
  results: AuthCheckResult[]
): DeliverabilityAlert[] {
  const alerts: DeliverabilityAlert[] = [];

  for (const result of results) {
    if (result.status === "fail") {
      alerts.push({
        id: `alert-${result.type}-${Date.now()}`,
        type: result.type,
        severity: result.type === "dmarc" ? "critical" : "warning",
        message: `${result.type.toUpperCase()} check failed${result.details ? `: ${result.details}` : ""}`,
        timestamp: result.lastChecked,
        acknowledged: false,
      });
    } else if (result.status === "none") {
      alerts.push({
        id: `alert-${result.type}-${Date.now()}`,
        type: result.type,
        severity: "warning",
        message: `${result.type.toUpperCase()} record not found`,
        timestamp: result.lastChecked,
        acknowledged: false,
      });
    }
  }

  return alerts;
}

/**
 * Compute deliverability statistics from a list of check results.
 */
export function computeStats(results: AuthCheckResult[]): DeliverabilityStats {
  const totalChecks = results.length;
  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const noneCount = results.filter((r) => r.status === "none").length;
  const passRate = totalChecks > 0 ? passCount / totalChecks : 0;

  const sortedByDate = [...results].sort(
    (a, b) => new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime()
  );

  return {
    totalChecks,
    passCount,
    failCount,
    noneCount,
    passRate,
    lastCheck: sortedByDate[0]?.lastChecked ?? null,
    alerts: generateAlerts(results),
  };
}

/**
 * Get a human-readable label for an auth check type.
 */
export function getAuthCheckLabel(type: AuthCheckType): string {
  const labels: Record<AuthCheckType, string> = {
    spf: "SPF",
    dkim: "DKIM",
    dmarc: "DMARC",
    mx: "MX Records",
  };
  return labels[type];
}

/**
 * Get a status color class for display.
 */
export function getStatusColor(status: AuthStatus): string {
  const colors: Record<AuthStatus, string> = {
    pass: "text-green-500",
    fail: "text-red-500",
    none: "text-yellow-500",
    unknown: "text-gray-500",
  };
  return colors[status];
}

/**
 * Generate compliance report summary.
 */
export function generateComplianceSummary(stats: DeliverabilityStats): {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (stats.failCount > 0) {
    const failedTypes = stats.alerts
      .filter((a) => a.severity === "critical" || a.severity === "warning")
      .map((a) => a.type.toUpperCase());
    issues.push(`Authentication failures: ${failedTypes.join(", ")}`);
  }

  if (stats.passRate < 1) {
    recommendations.push("Ensure all authentication records (SPF, DKIM, DMARC) are properly configured");
  }

  return {
    compliant: stats.passRate === 1 && stats.failCount === 0,
    issues,
    recommendations,
  };
}
