/**
 * Unit tests for spam rate monitoring utility.
 */
import { describe, it, expect } from "vitest";
import {
  SPAM_RATE_THRESHOLDS,
  calculateSpamRate,
  isSpamRateExceeded,
  generateSpamRateAlert,
  computeSpamRateStats,
  generateComplianceReport,
  getSpamRateStatusColor,
  formatSpamRate,
  createSpamRateDataPoint,
} from "@/lib/spam-rate-monitor";

describe("spam-rate-monitor", () => {
  describe("calculateSpamRate", () => {
    it("calculates spam rate correctly", () => {
      expect(calculateSpamRate(1000, 3)).toBe(0.003);
    });

    it("returns 0 when no emails sent", () => {
      expect(calculateSpamRate(0, 0)).toBe(0);
    });

    it("returns 0 when no spam reports", () => {
      expect(calculateSpamRate(1000, 0)).toBe(0);
    });
  });

  describe("isSpamRateExceeded", () => {
    it("returns true when critical threshold exceeded", () => {
      expect(isSpamRateExceeded(0.003, "critical")).toBe(true);
    });

    it("returns true when warning threshold exceeded", () => {
      expect(isSpamRateExceeded(0.002, "warning")).toBe(true);
    });

    it("returns false when below threshold", () => {
      expect(isSpamRateExceeded(0.001, "warning")).toBe(false);
    });
  });

  describe("generateSpamRateAlert", () => {
    it("generates critical alert", () => {
      const alert = generateSpamRateAlert(0.004, 1000, 4);
      expect(alert).toBeDefined();
      expect(alert?.threshold).toBe("critical");
      expect(alert?.message).toContain("CRITICAL");
    });

    it("generates warning alert", () => {
      const alert = generateSpamRateAlert(0.0025, 1000, 2.5);
      expect(alert).toBeDefined();
      expect(alert?.threshold).toBe("warning");
      expect(alert?.message).toContain("WARNING");
    });

    it("returns null when below thresholds", () => {
      const alert = generateSpamRateAlert(0.001, 1000, 1);
      expect(alert).toBeNull();
    });
  });

  describe("computeSpamRateStats", () => {
    it("computes stats from data points", () => {
      const dataPoints = [
        createSpamRateDataPoint(1000, 2),
        createSpamRateDataPoint(1000, 3),
        createSpamRateDataPoint(1000, 1),
      ];
      const stats = computeSpamRateStats(dataPoints);
      expect(stats.totalSent).toBe(3000);
      expect(stats.totalSpamReports).toBe(6);
      expect(stats.dataPoints).toBe(3);
    });

    it("returns zero stats for empty array", () => {
      const stats = computeSpamRateStats([]);
      expect(stats.totalSent).toBe(0);
      expect(stats.dataPoints).toBe(0);
    });

    it("calculates max and min rates", () => {
      const dataPoints = [
        createSpamRateDataPoint(1000, 5),
        createSpamRateDataPoint(1000, 1),
      ];
      const stats = computeSpamRateStats(dataPoints);
      expect(stats.maxRate).toBe(0.005);
      expect(stats.minRate).toBe(0.001);
    });
  });

  describe("generateComplianceReport", () => {
    it("returns compliant when below critical", () => {
      const dataPoints = [createSpamRateDataPoint(1000, 1)];
      const report = generateComplianceReport(dataPoints, "2026-09");
      expect(report.compliant).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    it("returns non-compliant when above critical", () => {
      const dataPoints = [createSpamRateDataPoint(1000, 4)];
      const report = generateComplianceReport(dataPoints, "2026-09");
      expect(report.compliant).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it("includes recommendations when warning threshold exceeded", () => {
      const dataPoints = [createSpamRateDataPoint(1000, 2.5)];
      const report = generateComplianceReport(dataPoints, "2026-09");
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("getSpamRateStatusColor", () => {
    it("returns green for low rate", () => {
      expect(getSpamRateStatusColor(0.001)).toBe("text-green-500");
    });

    it("returns yellow for warning rate", () => {
      expect(getSpamRateStatusColor(0.0025)).toBe("text-yellow-500");
    });

    it("returns red for critical rate", () => {
      expect(getSpamRateStatusColor(0.004)).toBe("text-red-500");
    });
  });

  describe("formatSpamRate", () => {
    it("formats as percentage", () => {
      expect(formatSpamRate(0.003)).toBe("0.30%");
    });

    it("formats zero", () => {
      expect(formatSpamRate(0)).toBe("0.00%");
    });
  });

  describe("createSpamRateDataPoint", () => {
    it("creates data point with calculated rate", () => {
      const point = createSpamRateDataPoint(1000, 3);
      expect(point.totalSent).toBe(1000);
      expect(point.spamReports).toBe(3);
      expect(point.spamRate).toBe(0.003);
      expect(point.timestamp).toBeDefined();
    });
  });

  describe("SPAM_RATE_THRESHOLDS", () => {
    it("has correct warning threshold", () => {
      expect(SPAM_RATE_THRESHOLDS.warning).toBe(0.002);
    });

    it("has correct critical threshold", () => {
      expect(SPAM_RATE_THRESHOLDS.critical).toBe(0.003);
    });
  });
});
