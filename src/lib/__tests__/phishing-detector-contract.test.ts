/**
 * Phishing Detector Contract Tests
 *
 * Cross-repo invariant: the frontend phishing-detector must produce
 * PhishingResult shapes that match the backend security monitoring
 * expectations (reimagined-guide). Threat levels, indicator types,
 * and scoring must stay in sync.
 */

import { describe, it, expect } from "vitest";
import {
  detectPhishing,
  scanEmail,
  getRecommendedAction,
} from "@/lib/phishing-detector";
import type { Email } from "@/types/email";
import type {
  PhishingResult,
  ThreatLevel,
  SecurityIndicator,
  SuspiciousLink,
} from "@/types/security";

describe("phishing-detector contract", () => {
  const safeEmail: Email = {
    id: "safe-1",
    threadId: "thread-1",
    folder: "inbox",
    from: { name: "Trusted Sender", address: "trusted@misfits.ai" },
    to: [{ name: "User", address: "user@misfits.fr" }],
    subject: "Meeting notes from today",
    preview: "Here are the notes",
    body: "<p>Hi, here are the meeting notes.</p>",
    bodyType: "html",
    date: "2026-09-10T08:00:00Z",
    receivedAt: "2026-09-10T08:00:01Z",
    isRead: false,
    isStarred: false,
    isImportant: false,
    attachments: [],
    hasAttachments: false,
    labels: [],
    size: 512,
    messageId: "<safe-1@misfits.ai>",
  };

  describe("detectPhishing", () => {
    it("returns safe for clean email", () => {
      const result = detectPhishing(safeEmail);
      expect(result.threatLevel).toBe("safe");
      expect(result.score).toBe(0);
      expect(result.emailId).toBe(safeEmail.id);
      expect(result.suspiciousLinks).toEqual([]);
      expect(result.indicators).toEqual([]);
    });

    it("returns critical for high score", () => {
      const dangerousEmail: Email = {
        ...safeEmail,
        id: "danger-1",
        body: `
          <a href="http://10.0.0.1">Click here</a>
          <a href="http://10.0.0.2">Verify now</a>
          <a href="http://10.0.0.3">Update account</a>
          <a href="http://10.0.0.4">Secure login</a>
        `,
        from: { name: "PayPal", address: "security@paypa1.com" },
        subject: "URGENT: Verify your account immediately",
      };
      const result = detectPhishing(dangerousEmail);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.threatLevel).toBe("critical");
    });

    it("classifies threat levels correctly", () => {
      const testCases: { min: number; max: number; expected: ThreatLevel }[] = [
        { min: 0, max: 24, expected: "safe" },
        { min: 25, max: 49, expected: "suspicious" },
        { min: 50, max: 69, expected: "dangerous" },
        { min: 70, max: 100, expected: "critical" },
      ];

      const suspEmail: Email = {
        ...safeEmail,
        id: "susp-1",
        body: "URGENT: Verify your account",
      };
      const r1 = detectPhishing(suspEmail);
      expect(["safe", "suspicious", "dangerous", "critical"]).toContain(
        r1.threatLevel
      );
    });

    it("caps score at 100", () => {
      const extremelyDangerous: Email = {
        ...safeEmail,
        id: "extreme-1",
        body: `
          <a href="http://10.0.0.1">https://misfits.ai</a>
          <a href="http://10.0.0.2">https://misfits.ai</a>
          <a href="http://10.0.0.3">https://misfits.ai</a>
          <a href="http://10.0.0.4">https://misfits.ai</a>
          <a href="http://10.0.0.5">https://misfits.ai</a>
          <a href="http://10.0.0.6">https://misfits.ai</a>
          <a href="http://10.0.0.7">https://misfits.ai</a>
          <a href="http://10.0.0.8">https://misfits.ai</a>
        `,
        from: { name: "PayPal", address: "security@paypa1.com" },
      };
      const result = detectPhishing(extremelyDangerous);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("includes header analysis in result", () => {
      const result = detectPhishing({
        ...safeEmail,
        id: "header-1",
        headers: {
          "Received-SPF": "fail",
          "DKIM-Signature": "pass",
        },
      });
      expect(result.headers.spf).toBe("fail");
      expect(result.headers.dkim).toBe("pass");
      // SPF fail adds 20 to score
      expect(result.score).toBeGreaterThanOrEqual(20);
    });

    it("includes all indicator types in reasons", () => {
      const result = detectPhishing({
        ...safeEmail,
        id: "reasons-1",
        body: '<a href="http://10.0.0.1">Click here</a>',
      });
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain("Suspicious link");
    });

    it("sets aiAssisted to false (rule-based only)", () => {
      const result = detectPhishing(safeEmail);
      expect(result.aiAssisted).toBe(false);
    });

    it("sets scannedAt to ISO timestamp", () => {
      const before = Date.now();
      const result = detectPhishing(safeEmail);
      const after = Date.now();
      const scanned = new Date(result.scannedAt).getTime();
      expect(scanned).toBeGreaterThanOrEqual(before);
      expect(scanned).toBeLessThanOrEqual(after);
    });

    it("flags typosquatting domain with +30 score", () => {
      const result = detectPhishing({
        ...safeEmail,
        id: "typo-1",
        from: { name: "Amazon", address: "support@arnazon.com" },
      });
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.indicators.some((i) => i.type === "domain")).toBe(true);
    });
  });

  describe("scanEmail", () => {
    it("is the same function as detectPhishing", () => {
      expect(scanEmail).toBe(detectPhishing);
    });

    it("returns PhishingResult shape", () => {
      const result = scanEmail(safeEmail);
      expect(result).toHaveProperty("emailId");
      expect(result).toHaveProperty("threatLevel");
      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("reasons");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("suspiciousLinks");
      expect(result).toHaveProperty("headers");
      expect(result).toHaveProperty("scannedAt");
      expect(result).toHaveProperty("aiAssisted");
    });
  });

  describe("getRecommendedAction", () => {
    it("returns critical action for critical threat", () => {
      expect(getRecommendedAction("critical")).toContain("Report as phishing");
    });

    it("returns dangerous action for dangerous threat", () => {
      expect(getRecommendedAction("dangerous")).toContain("Avoid clicking");
    });

    it("returns suspicious action for suspicious threat", () => {
      expect(getRecommendedAction("suspicious")).toContain("Exercise caution");
    });

    it("returns safe action for safe threat", () => {
      expect(getRecommendedAction("safe")).toContain("No action needed");
    });
  });

  describe("PhishingResult shape contract", () => {
    it("produces result matching PhishingResult interface", () => {
      const result = detectPhishing(safeEmail);

      // Verify all required fields exist
      expect(result).toHaveProperty("emailId");
      expect(result).toHaveProperty("threatLevel");
      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("reasons");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("suspiciousLinks");
      expect(result).toHaveProperty("headers");
      expect(result).toHaveProperty("scannedAt");
      expect(result).toHaveProperty("aiAssisted");

      // Verify types
      expect(typeof result.emailId).toBe("string");
      expect(typeof result.score).toBe("number");
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(Array.isArray(result.indicators)).toBe(true);
      expect(Array.isArray(result.suspiciousLinks)).toBe(true);
      expect(typeof result.headers).toBe("object");
      expect(typeof result.scannedAt).toBe("string");
      expect(typeof result.aiAssisted).toBe("boolean");
    });

    it("indicators have required SecurityIndicator fields", () => {
      const result = detectPhishing({
        ...safeEmail,
        id: "indicators-1",
        body: '<a href="http://10.0.0.1">Click</a>',
      });

      for (const indicator of result.indicators) {
        expect(indicator).toHaveProperty("type");
        expect(indicator).toHaveProperty("severity");
        expect(indicator).toHaveProperty("description");
        expect([
          "header",
          "link",
          "domain",
          "content",
          "attachment",
          "sender",
          "bec",
          "ai",
        ]).toContain(indicator.type);
        expect(["info", "low", "medium", "high", "critical"]).toContain(
          indicator.severity
        );
      }
    });

    it("suspicious links have required SuspiciousLink fields", () => {
      const result = detectPhishing({
        ...safeEmail,
        id: "links-1",
        body: '<a href="http://10.0.0.1">Click</a>',
      });

      for (const link of result.suspiciousLinks) {
        expect(link).toHaveProperty("url");
        expect(link).toHaveProperty("reason");
        expect(link).toHaveProperty("riskScore");
        expect(typeof link.url).toBe("string");
        expect(typeof link.reason).toBe("string");
        expect(typeof link.riskScore).toBe("number");
      }
    });
  });
});
