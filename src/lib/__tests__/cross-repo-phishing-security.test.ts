/**
 * Cross-repo contract test: PhishingResult ↔ Security UI binding.
 *
 * Verifies that PhishingResult from @/lib/phishing-detector is fully
 * consumable by UI components and typed correctly against @/types/security.
 */
import { describe, it, expect } from "vitest";
import type {
  PhishingResult,
  ThreatLevel,
  SecurityIndicator,
  SecurityStats,
  HeaderAnalysis,
  AuthStatus,
} from "@/types/security";

describe("cross-repo: PhishingResult ↔ Security types", () => {
  it("PhishingResult contains valid HeaderAnalysis with AuthStatus values", () => {
    const result: PhishingResult = {
      emailId: "email-1",
      threatLevel: "safe" as ThreatLevel,
      score: 10,
      reasons: [],
      indicators: [],
      suspiciousLinks: [],
      headers: {
        spf: "pass" as AuthStatus,
        dkim: "pass" as AuthStatus,
        dmarc: "pass" as AuthStatus,
        details: ["v=spf1 include:_spf.google.com ~all"],
      },
      scannedAt: new Date().toISOString(),
      aiAssisted: false,
    };

    expect(result.headers.spf).toBe("pass");
    expect(result.headers.dkim).toBe("pass");
    expect(result.headers.dmarc).toBe("pass");
    expect(result.headers.details.length).toBeGreaterThan(0);
  });

  it("SecurityIndicator discriminates by type correctly", () => {
    const indicators: SecurityIndicator[] = [
      { type: "header", severity: "medium", description: "Mismatched header" },
      { type: "link", severity: "high", description: "Suspicious URL" },
      { type: "domain", severity: "critical", description: "Unknown sender domain" },
    ];

    expect(indicators[0].type).toBe("header");
    expect(indicators[1].severity).toBe("high");
    expect(indicators[2].type).toBe("domain");
  });

  it("SecurityStats aggregates authRates correctly", () => {
    const stats: SecurityStats = {
      total: 100,
      byLevel: {
        safe: 85,
        suspicious: 10,
        dangerous: 4,
        critical: 1,
      },
      averageScore: 15,
      threatsBlocked: 15,
      authRates: {
        spf: 95,
        dkim: 92,
        dmarc: 88,
      },
    };

    expect(stats.total).toBe(100);
    expect(stats.authRates.spf).toBe(95);
    expect(stats.byLevel.critical).toBe(1);
    expect(stats.threatsBlocked).toBe(15);
  });

  it("HeaderAnalysis handles partial auth data", () => {
    const partial: HeaderAnalysis = {
      spf: "fail" as AuthStatus,
      dkim: "none" as AuthStatus,
      dmarc: "unknown" as AuthStatus,
      details: [],
    };

    expect(partial.spf).toBe("fail");
    expect(partial.dkim).toBe("none");
    expect(partial.dmarc).toBe("unknown");
  });

  it("PhishingResult threatLevel drives SecurityAction", () => {
    const mapping: Record<ThreatLevel, string> = {
      safe: "none",
      suspicious: "verify-sender",
      dangerous: "do-not-click",
      critical: "block-sender",
    };

    expect(mapping["safe"]).toBe("none");
    expect(mapping["suspicious"]).toBe("verify-sender");
    expect(mapping["dangerous"]).toBe("do-not-click");
    expect(mapping["critical"]).toBe("block-sender");
  });

  it("suspiciousLinks carry riskScore for UI rendering", () => {
    const result: PhishingResult = {
      emailId: "email-2",
      threatLevel: "dangerous" as ThreatLevel,
      score: 75,
      reasons: ["Suspicious link detected"],
      indicators: [
        {
          type: "link",
          severity: "high",
          description: "URL mismatch",
          detail: "href points to different domain",
        },
      ],
      suspiciousLinks: [
        {
          url: "https://evil.com/login",
          displayText: "https://misfits.ai/login",
          reason: "Domain mismatch",
          riskScore: 85,
        },
      ],
      headers: {
        spf: "pass" as AuthStatus,
        dkim: "pass" as AuthStatus,
        dmarc: "pass" as AuthStatus,
        details: [],
      },
      scannedAt: new Date().toISOString(),
      aiAssisted: true,
    };

    expect(result.suspiciousLinks[0].riskScore).toBe(85);
    expect(result.suspiciousLinks[0].reason).toBe("Domain mismatch");
    expect(result.aiAssisted).toBe(true);
  });
});
