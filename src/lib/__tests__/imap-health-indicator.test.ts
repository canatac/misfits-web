import { describe, it, expect } from "vitest";
import {
  computeImapHealth,
  deriveStatus,
  formatHealthStatus,
  requiresAttention,
  healthTrend,
} from "@/lib/imap-health-indicator";
import type { HealthSample } from "@/lib/imap-health-indicator";

function makeSample(success: boolean, latencyMs: number, timestamp: string, error?: string): HealthSample {
  return { timestamp, success, latencyMs, error };
}

describe("computeImapHealth", () => {
  it("returns unknown for no samples", () => {
    const health = computeImapHealth("acc1", []);
    expect(health.status).toBe("unknown");
    expect(health.totalChecks).toBe(0);
  });

  it("computes healthy state from all-success samples", () => {
    const samples = [
      makeSample(true, 500, "2026-03-15T09:00:00Z"),
      makeSample(true, 600, "2026-03-15T09:05:00Z"),
      makeSample(true, 550, "2026-03-15T09:10:00Z"),
    ];
    const health = computeImapHealth("acc1", samples);
    expect(health.status).toBe("healthy");
    expect(health.successRate).toBe(1);
    expect(health.avgLatencyMs).toBe(550);
  });

  it("computes degraded for some failures", () => {
    const samples = [
      makeSample(true, 500, "2026-03-15T09:00:00Z"),
      makeSample(false, 0, "2026-03-15T09:05:00Z", "timeout"),
      makeSample(true, 600, "2026-03-15T09:10:00Z"),
      makeSample(true, 550, "2026-03-15T09:15:00Z"),
      makeSample(true, 500, "2026-03-15T09:20:00Z"),
    ];
    const health = computeImapHealth("acc1", samples);
    expect(health.status).toBe("degraded"); // 80% success = degraded
    expect(health.successRate).toBe(0.8);
    expect(health.lastErrorAt).toBe("2026-03-15T09:05:00Z");
  });

  it("computes down for major failures", () => {
    const samples = [
      makeSample(false, 0, "2026-03-15T09:00:00Z", "refused"),
      makeSample(false, 0, "2026-03-15T09:05:00Z", "refused"),
      makeSample(true, 500, "2026-03-15T09:10:00Z"),
    ];
    const health = computeImapHealth("acc1", samples);
    expect(health.status).toBe("down"); // 33% success
    expect(health.successRate).toBeCloseTo(0.333, 2);
  });

  it("tracks last success timestamp", () => {
    const samples = [
      makeSample(true, 500, "2026-03-15T09:00:00Z"),
      makeSample(false, 0, "2026-03-15T09:05:00Z", "timeout"),
    ];
    const health = computeImapHealth("acc1", samples);
    expect(health.lastSuccessAt).toBe("2026-03-15T09:00:00Z");
  });
});

describe("deriveStatus", () => {
  it("returns healthy for 100% success and low latency", () => {
    expect(deriveStatus(1, 200, null)).toBe("healthy");
  });

  it("returns degraded for high latency", () => {
    expect(deriveStatus(1, 5000, null)).toBe("degraded");
  });

  it("returns degraded for <80% success", () => {
    expect(deriveStatus(0.7, 200, "2026-03-15T09:00:00Z")).toBe("degraded");
  });

  it("returns down for <50% success", () => {
    expect(deriveStatus(0.3, 200, "2026-03-15T09:00:00Z")).toBe("down");
  });
});

describe("formatHealthStatus", () => {
  it("formats healthy", () => {
    const result = formatHealthStatus("healthy");
    expect(result.label).toBe("Connected");
    expect(result.color).toBe("#2ecc71");
  });

  it("formats down", () => {
    const result = formatHealthStatus("down");
    expect(result.label).toBe("Disconnected");
  });

  it("formats unknown", () => {
    const result = formatHealthStatus("unknown");
    expect(result.dot).toBe("◌");
  });
});

describe("requiresAttention", () => {
  it("returns true for down", () => {
    const health = computeImapHealth("acc1", [
      makeSample(false, 0, "2026-03-15T09:00:00Z", "refused"),
    ]);
    expect(requiresAttention(health)).toBe(true);
  });

  it("returns false for healthy", () => {
    const health = computeImapHealth("acc1", [
      makeSample(true, 500, "2026-03-15T09:00:00Z"),
    ]);
    expect(requiresAttention(health)).toBe(false);
  });
});

describe("healthTrend", () => {
  it("returns ↑ for improving", () => {
    expect(healthTrend("down", "healthy")).toBe("↑");
  });

  it("returns ↓ for worsening", () => {
    expect(healthTrend("healthy", "down")).toBe("↓");
  });

  it("returns → for stable", () => {
    expect(healthTrend("healthy", "healthy")).toBe("→");
  });
});
