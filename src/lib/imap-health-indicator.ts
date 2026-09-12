/**
 * IMAP Health Indicator (Issue #476).
 *
 * Compute a per-account health status for IMAP connections.
 * Tracks connection errors, latency, and sync freshness to surface
 * actionable status in the account settings UI.
 */

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

/** A single health metric sample. */
export interface HealthSample {
  /** ISO timestamp of the check. */
  timestamp: string;
  /** Whether the connection succeeded. */
  success: boolean;
  /** Response time in milliseconds. */
  latencyMs: number;
  /** Error message if failed. */
  error?: string;
}

/** Aggregated health status for one IMAP account. */
export interface ImapHealth {
  /** Account identifier. */
  accountId: string;
  /** Overall health status. */
  status: HealthStatus;
  /** Success rate over the window (0-1). */
  successRate: number;
  /** Average latency in ms. */
  avgLatencyMs: number;
  /** Last successful sync ISO time (null = never). */
  lastSuccessAt: string | null;
  /** Last error ISO time (null = no errors). */
  lastErrorAt: string | null;
  /** Total checks in the window. */
  totalChecks: number;
}

/** Threshold constants. */
export const HEALTH_THRESHOLDS = {
  /** Below this success rate → degraded. */
  DEGRADED_RATE: 0.8,
  /** Below this success rate → down. */
  DOWN_RATE: 0.5,
  /** Above this latency → degraded. */
  HIGH_LATENCY_MS: 2000,
} as const;

/**
 * Compute health status from a list of recent samples.
 *
 * Aggregates the trailing window of samples into a single health snapshot
 * suitable for display in the account dashboard.
 *
 * @param accountId Account identifier.
 * @param samples Recent health samples (newest last).
 * @returns Aggregated health status.
 */
export function computeImapHealth(
  accountId: string,
  samples: HealthSample[]
): ImapHealth {
  if (samples.length === 0) {
    return {
      accountId,
      status: "unknown",
      successRate: 0,
      avgLatencyMs: 0,
      lastSuccessAt: null,
      lastErrorAt: null,
      totalChecks: 0,
    };
  }

  const successes = samples.filter((s) => s.success);
  const failures = samples.filter((s) => !s.success);

  const successRate = successes.length / samples.length;
  const avgLatencyMs =
    successes.length > 0
      ? successes.reduce((sum, s) => sum + s.latencyMs, 0) / successes.length
      : 0;

  // Find last success and error timestamps (samples sorted oldest→newest)
  let lastSuccessAt: string | null = null;
  let lastErrorAt: string | null = null;

  for (const s of samples) {
    if (s.success) lastSuccessAt = s.timestamp;
    else lastErrorAt = s.timestamp;
  }

  const status = deriveStatus(successRate, avgLatencyMs, lastErrorAt);

  return {
    accountId,
    status,
    successRate,
    avgLatencyMs: Math.round(avgLatencyMs),
    lastSuccessAt,
    lastErrorAt,
    totalChecks: samples.length,
  };
}

/**
 * Derive a status label from metrics.
 *
 * @param successRate 0-1 ratio.
 * @param avgLatencyMs Average latency.
 * @param lastErrorAt Last error timestamp.
 * @returns Computed status.
 */
export function deriveStatus(
  successRate: number,
  avgLatencyMs: number,
  lastErrorAt: string | null
): HealthStatus {
  if (successRate < HEALTH_THRESHOLDS.DOWN_RATE) return "down";
  if (successRate < HEALTH_THRESHOLDS.DEGRADED_RATE) return "degraded";
  if (avgLatencyMs > HEALTH_THRESHOLDS.HIGH_LATENCY_MS) return "degraded";
  if (successRate === 1 && !lastErrorAt) return "healthy";
  // Check if the last sample was an error
  return "healthy";
}

/**
 * Format a health status for UI display.
 *
 * @param status Health status.
 * @returns Display label and color.
 */
export function formatHealthStatus(
  status: HealthStatus
): { label: string; color: string; dot: string } {
  switch (status) {
    case "healthy":
      return { label: "Connected", color: "#2ecc71", dot: "●" };
    case "degraded":
      return { label: "Degraded", color: "#f39c12", dot: "●" };
    case "down":
      return { label: "Disconnected", color: "#e74c3c", dot: "●" };
    case "unknown":
      return { label: "Unknown", color: "#95a5a6", dot: "◌" };
  }
}

/**
 * Determine if a health state warrants an alert (notification/email).
 *
 * @param health Current health.
 * @returns True if the account needs attention.
 */
export function requiresAttention(health: ImapHealth): boolean {
  return health.status === "down" || health.status === "degraded";
}

/**
 * Build a simple trend arrow indicator from two consecutive health states.
 *
 * @param previous Previous health status.
 * @param current Current health status.
 * @returns Arrow indicator: "↑", "↓", or "→".
 */
export function healthTrend(
  previous: HealthStatus,
  current: HealthStatus
): "↑" | "↓" | "→" {
  const order: HealthStatus[] = ["unknown", "down", "degraded", "healthy"];
  const prevIdx = order.indexOf(previous);
  const currIdx = order.indexOf(current);

  if (currIdx > prevIdx) return "↑";
  if (currIdx < prevIdx) return "↓";
  return "→";
}
