/**
 * Unit tests for deliverability monitoring.
 */
import { describe, it, expect } from "vitest";
import {
  parseAuthStatus,
  generateAlerts,
  computeStats,
  getAuthCheckLabel,
  getStatusColor,
  generateComplianceSummary,
} from "@/lib/deliverability-monitor";
import type { AdminDeliverabilityDiagnosticsResponse } from "@/types/admin-ops-deliverability";

describe("deliverability-monitor", () => {
  describe("parseAuthStatus", () => {
    it("parses all auth checks from diagnostics", () => {
      const diagnostics: AdminDeliverabilityDiagnosticsResponse = {
        window: "24h",
        spf: { valid: true, record: "v=spf1 include:_spf.google.com ~all" },
        dkim: { valid: true, domains: ["example.com"] },
        dmarc: { valid: true, record: "v=DMARC1; p=quarantine;" },
        mx: { records: ["mail.example.com"] },
      };
      const results = parseAuthStatus(diagnostics);
      expect(results).toHaveLength(4);
      expect(results.every((r) => r.status === "pass")).toBe(true);
    });

    it("detects failed auth checks", () => {
      const diagnostics: AdminDeliverabilityDiagnosticsResponse = {
        window: "24h",
        spf: { valid: false },
        dkim: { valid: false },
        dmarc: { valid: false },
      };
      const results = parseAuthStatus(diagnostics);
      expect(results.every((r) => r.status === "fail")).toBe(true);
    });

    it("handles missing data", () => {
      const diagnostics: AdminDeliverabilityDiagnosticsResponse = {
        window: "24h",
      };
      const results = parseAuthStatus(diagnostics);
      expect(results).toHaveLength(0);
    });
  });

  describe("generateAlerts", () => {
    it("generates alerts for failed checks", () => {
      const results = [
        { type: "spf" as const, status: "fail" as const, lastChecked: new Date().toISOString() },
        { type: "dkim" as const, status: "pass" as const, lastChecked: new Date().toISOString() },
      ];
      const alerts = generateAlerts(results);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("spf");
    });

    it("generates alerts for missing records", () => {
      const results = [
        { type: "mx" as const, status: "none" as const, lastChecked: new Date().toISOString() },
      ];
      const alerts = generateAlerts(results);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe("warning");
    });

    it("marks DMARC failure as critical", () => {
      const results = [
        { type: "dmarc" as const, status: "fail" as const, lastChecked: new Date().toISOString() },
      ];
      const alerts = generateAlerts(results);
      expect(alerts[0].severity).toBe("critical");
    });
  });

  describe("computeStats", () => {
    it("computes pass rate correctly", () => {
      const results = [
        { type: "spf" as const, status: "pass" as const, lastChecked: new Date().toISOString() },
        { type: "dkim" as const, status: "pass" as const, lastChecked: new Date().toISOString() },
        { type: "dmarc" as const, status: "fail" as const, lastChecked: new Date().toISOString() },
      ];
      const stats = computeStats(results);
      expect(stats.passRate).toBeCloseTo(2 / 3);
      expect(stats.passCount).toBe(2);
      expect(stats.failCount).toBe(1);
    });

    it("returns zero stats for empty results", () => {
      const stats = computeStats([]);
      expect(stats.passRate).toBe(0);
      expect(stats.totalChecks).toBe(0);
    });
  });

  describe("getAuthCheckLabel", () => {
    it("returns correct labels", () => {
      expect(getAuthCheckLabel("spf")).toBe("SPF");
      expect(getAuthCheckLabel("dkim")).toBe("DKIM");
      expect(getAuthCheckLabel("dmarc")).toBe("DMARC");
      expect(getAuthCheckLabel("mx")).toBe("MX Records");
    });
  });

  describe("getStatusColor", () => {
    it("returns correct colors", () => {
      expect(getStatusColor("pass")).toBe("text-green-500");
      expect(getStatusColor("fail")).toBe("text-red-500");
      expect(getStatusColor("none")).toBe("text-yellow-500");
    });
  });

  describe("generateComplianceSummary", () => {
    it("returns compliant when all pass", () => {
      const stats = computeStats([
        { type: "spf" as const, status: "pass" as const, lastChecked: new Date().toISOString() },
        { type: "dkim" as const, status: "pass" as const, lastChecked: new Date().toISOString() },
      ]);
      const summary = generateComplianceSummary(stats);
      expect(summary.compliant).toBe(true);
      expect(summary.issues).toHaveLength(0);
    });

    it("returns non-compliant when failures exist", () => {
      const stats = computeStats([
        { type: "spf" as const, status: "fail" as const, lastChecked: new Date().toISOString() },
      ]);
      const summary = generateComplianceSummary(stats);
      expect(summary.compliant).toBe(false);
      expect(summary.issues.length).toBeGreaterThan(0);
      expect(summary.recommendations.length).toBeGreaterThan(0);
    });
  });
});
