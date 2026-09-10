/**
 * Spam rate monitoring utility (Issue #540).
 *
 * Monitors email spam rates in real-time, generates alerts when thresholds
 * are exceeded, and provides compliance reporting for Gmail/Yahoo requirements.
 */

export type SpamRateThreshold = "warning" | "critical";

export interface SpamRateDataPoint {
  timestamp: string;
  totalSent: number;
  spamReports: number;
  spamRate: number; // 0-1
}

export interface SpamRateAlert {
  id: string;
  threshold: SpamRateThreshold;
  spamRate: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SpamRateStats {
  currentRate: number;
  averageRate: number;
  maxRate: number;
  minRate: number;
  totalSent: number;
  totalSpamReports: number;
  dataPoints: number;
}

export interface ComplianceReport {
  period: string;
  averageSpamRate: number;
  compliant: boolean;
  issues: string[];
  recommendations: string[];
}

export const SPAM_RATE_THRESHOLDS = {
  warning: 0.002, // 0.2%
  critical: 0.003, // 0.3%
};

/**
 * Calculate spam rate from sent and spam report counts.
 */
export function calculateSpamRate(totalSent: number, spamReports: number): number {
  if (totalSent === 0) return 0;
  return spamReports / totalSent;
}

/**
 * Check if spam rate exceeds a threshold.
 */
export function isSpamRateExceeded(rate: number, threshold: SpamRateThreshold): boolean {
  return rate >= SPAM_RATE_THRESHOLDS[threshold];
}

/**
 * Generate a spam rate alert if threshold exceeded.
 */
export function generateSpamRateAlert(
  rate: number,
  totalSent: number,
  spamReports: number
): SpamRateAlert | null {
  if (rate >= SPAM_RATE_THRESHOLDS.critical) {
    return {
      id: `spam-alert-critical-${Date.now()}`,
      threshold: "critical",
      spamRate: rate,
      message: `CRITICAL: Spam rate ${(rate * 100).toFixed(2)}% exceeds 0.3% threshold`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
  }

  if (rate >= SPAM_RATE_THRESHOLDS.warning) {
    return {
      id: `spam-alert-warning-${Date.now()}`,
      threshold: "warning",
      spamRate: rate,
      message: `WARNING: Spam rate ${(rate * 100).toFixed(2)}% exceeds 0.2% threshold`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
  }

  return null;
}

/**
 * Compute spam rate statistics from data points.
 */
export function computeSpamRateStats(dataPoints: SpamRateDataPoint[]): SpamRateStats {
  if (dataPoints.length === 0) {
    return {
      currentRate: 0,
      averageRate: 0,
      maxRate: 0,
      minRate: 0,
      totalSent: 0,
      totalSpamReports: 0,
      dataPoints: 0,
    };
  }

  const rates = dataPoints.map((d) => d.spamRate);
  const totalSent = dataPoints.reduce((sum, d) => sum + d.totalSent, 0);
  const totalSpamReports = dataPoints.reduce((sum, d) => sum + d.spamReports, 0);

  return {
    currentRate: dataPoints[dataPoints.length - 1].spamRate,
    averageRate: rates.reduce((sum, r) => sum + r, 0) / rates.length,
    maxRate: Math.max(...rates),
    minRate: Math.min(...rates),
    totalSent,
    totalSpamReports,
    dataPoints: dataPoints.length,
  };
}

/**
 * Generate a compliance report for a given period.
 */
export function generateComplianceReport(
  dataPoints: SpamRateDataPoint[],
  period: string
): ComplianceReport {
  const stats = computeSpamRateStats(dataPoints);
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (stats.averageRate >= SPAM_RATE_THRESHOLDS.critical) {
    issues.push(`Average spam rate ${(stats.averageRate * 100).toFixed(2)}% exceeds 0.3% limit`);
    recommendations.push("Immediately review email content and sending practices");
    recommendations.push("Consider reducing email frequency");
  } else if (stats.averageRate >= SPAM_RATE_THRESHOLDS.warning) {
    issues.push(`Average spam rate ${(stats.averageRate * 100).toFixed(2)}% approaching 0.3% limit`);
    recommendations.push("Monitor spam rate closely and review email content");
  }

  if (stats.maxRate >= SPAM_RATE_THRESHOLDS.critical) {
    issues.push(`Peak spam rate ${(stats.maxRate * 100).toFixed(2)}% exceeded critical threshold`);
  }

  return {
    period,
    averageSpamRate: stats.averageRate,
    compliant: stats.averageRate < SPAM_RATE_THRESHOLDS.critical,
    issues,
    recommendations,
  };
}

/**
 * Get the status color for a spam rate.
 */
export function getSpamRateStatusColor(rate: number): string {
  if (rate >= SPAM_RATE_THRESHOLDS.critical) return "text-red-500";
  if (rate >= SPAM_RATE_THRESHOLDS.warning) return "text-yellow-500";
  return "text-green-500";
}

/**
 * Format spam rate as percentage string.
 */
export function formatSpamRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Create a spam rate data point.
 */
export function createSpamRateDataPoint(
  totalSent: number,
  spamReports: number
): SpamRateDataPoint {
  return {
    timestamp: new Date().toISOString(),
    totalSent,
    spamReports,
    spamRate: calculateSpamRate(totalSent, spamReports),
  };
}
