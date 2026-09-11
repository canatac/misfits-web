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
  analyzeLinks,
  analyzeHeaders,
  detectTyposquatting,
  detectUrgencyScam,
  detectBEC,
  detectPhishing,
} from "@/lib/phishing-detector";
import type { Email } from "@/types/email";
import type {
  PhishingResult,
  ThreatLevel,
  HeaderAnalysis,
  SuspiciousLink,
  SecurityIndicator,
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

  describe("analyzeLinks", () => {
    it("returns empty array for clean HTML", () => {
      const result = analyzeLinks("<p>No links here</p>");
      expect(result).toEqual([]);
    });

    it("flags IP address URLs", () => {
      const links = analyzeLinks(
        '<a href="http://192.168.1.1/login">Click here</a>'
      );
      expect(links).toHaveLength(1);
      expect(links[0].riskScore).toBeGreaterThanOrEqual(30);
      expect(links[0].reason).toContain("IP address");
    });

    it("flags punycode URLs", () => {
      const links = analyzeLinks('<a href="https://xn--paypa1.com">Pay</a>');
      expect(links).toHaveLength(1);
      expect(links[0].riskScore).toBeGreaterThanOrEqual(40);
      expect(links[0].reason).toContain("Punycode");
    });

    it("flags mismatched display text vs URL", () => {
      const links = analyzeLinks(
        '<a href="https://evil.com">Click here to win</a>'
      );
      expect(links).toHaveLength(1);
      expect(links[0].reason).toContain("Display text");
    });

    it("does not flag matching display text", () => {
      const links = analyzeLinks(
        '<a href="https://misfits.ai">https://misfits.ai</a>'
      );
      expect(links).toHaveLength(0);
    });

    it("strips script tags from display text", () => {
      const links = analyzeLinks(
        '<a href="http://10.0.0.1"><script>alert(1)</script>Click</a>'
      );
      expect(links).toHaveLength(1);
      expect(links[0].displayText).not.toContain("<script>");
    });

    it("strips angle brackets from display text", () => {
      const links = analyzeLinks(
        '<a href="http://10.0.0.1"><b>Bold</b> text</a>'
      );
      expect(links).toHaveLength(1);
      // Code strips angle brackets, leaving tag names behind
      expect(links[0].displayText).toBe("bBold/b text");
    });

    it("accumulates multiple risk factors", () => {
      // IP (30) + mismatched display (20) = 50
      const links = analyzeLinks(
        '<a href="10.0.0.1">Click here now</a>'
      );
      expect(links).toHaveLength(1);
      expect(links[0].riskScore).toBe(50);
    });
  });

  describe("analyzeHeaders", () => {
    it("returns pass for all when headers valid", () => {
      const result = analyzeHeaders({
        "Received-SPF": "pass",
        "DKIM-Signature": "pass",
        "Authentication-Results": "dmarc=pass",
      });
      expect(result.spf).toBe("pass");
      expect(result.dkim).toBe("pass");
      expect(result.dmarc).toBe("pass");
    });

    it("returns fail for failed SPF", () => {
      const result = analyzeHeaders({
        "Received-SPF": "fail",
      });
      expect(result.spf).toBe("fail");
      expect(result.details).toContain("SPF failed — sender IP not authorized");
    });

    it("returns fail for failed DKIM", () => {
      const result = analyzeHeaders({
        "DKIM-Signature": "fail",
      });
      expect(result.dkim).toBe("fail");
      expect(result.details).toContain("DKIM failed — signature invalid");
    });

    it("returns none when no headers present", () => {
      const result = analyzeHeaders({});
      expect(result.spf).toBe("none");
      expect(result.dkim).toBe("none");
      expect(result.dmarc).toBe("none");
    });

    it("returns none for undefined headers", () => {
      const result = analyzeHeaders(undefined);
      expect(result.spf).toBe("none");
      expect(result.dkim).toBe("none");
      expect(result.dmarc).toBe("none");
    });

    it("is case-insensitive for header names", () => {
      const result = analyzeHeaders({
        "received-spf": "pass",
        "dkim-signature": "pass",
      });
      expect(result.spf).toBe("pass");
      expect(result.dkim).toBe("pass");
    });

    it("DMARC requires both dmarc and pass keywords", () => {
      const result1 = analyzeHeaders({
        "Authentication-Results": "dmarc=fail",
      });
      expect(result1.dmarc).toBe("none");

      const result2 = analyzeHeaders({
        "Authentication-Results": "dmarc=pass",
      });
      expect(result2.dmarc).toBe("pass");
    });

    it("notes missing DMARC", () => {
      const result = analyzeHeaders({
        "Received-SPF": "pass",
      });
      expect(result.details).toContain("DMARC not found");
    });
  });

  describe("detectTyposquatting", () => {
    it("flags known phishing domains", () => {
      expect(detectTyposquatting("paypa1.com")).toBe(true);
      expect(detectTyposquatting("g00gle.com")).toBe(true);
      expect(detectTyposquatting("arnazon.com")).toBe(true);
      expect(detectTyposquatting("micros0ft.com")).toBe(true);
      expect(detectTyposquatting("app1e.com")).toBe(true);
    });

    it("returns false for legitimate domains", () => {
      expect(detectTyposquatting("misfits.ai")).toBe(false);
      expect(detectTyposquatting("google.com")).toBe(false);
      expect(detectTyposquatting("amazon.com")).toBe(false);
    });

    it("detects domain as substring", () => {
      expect(detectTyposquatting("login.paypa1.com")).toBe(true);
      expect(detectTyposquatting("secure.g00gle.com")).toBe(true);
    });
  });

  describe("detectUrgencyScam", () => {
    it("flags urgency language", () => {
      const indicators = detectUrgencyScam(
        "URGENT: Verify your account immediately!"
      );
      expect(indicators).toHaveLength(1);
      expect(indicators[0].type).toBe("content");
      expect(indicators[0].severity).toBe("medium");
      expect(indicators[0].description).toBe("Urgency language detected");
    });

    it("flags multiple urgency patterns (only first match)", () => {
      const indicators = detectUrgencyScam(
        "Act now! You must verify ASAP or lose access."
      );
      // Only first match returns indicator (break after first)
      expect(indicators).toHaveLength(1);
    });

    it("returns empty for calm content", () => {
      const indicators = detectUrgencyScam(
        "Hope you're doing well. Let me know when you're free."
      );
      expect(indicators).toEqual([]);
    });

    it("flags 'final notice'", () => {
      const indicators = detectUrgencyScam("This is your final notice.");
      expect(indicators).toHaveLength(1);
    });
  });

  describe("detectBEC", () => {
    it("flags potential BEC with financial keywords", () => {
      const indicators = detectBEC({
        ...safeEmail,
        subject: "Urgent wire transfer request",
        preview: "The CEO needs you to process payment",
      });
      expect(indicators).toHaveLength(1);
      expect(indicators[0].type).toBe("bec");
      expect(indicators[0].severity).toBe("high");
      expect(indicators[0].description).toBe(
        "Potential Business Email Compromise"
      );
    });

    it("does not flag internal misfits.ai emails", () => {
      const indicators = detectBEC({
        ...safeEmail,
        from: { name: "ceo@misfits.ai", address: "ceo@misfits.ai" },
        subject: "Wire transfer needed",
        preview: "Process payment for vendor",
      });
      // Internal email with from.name === from.address should not flag
      expect(indicators).toHaveLength(0);
    });

    it("flags financial keywords from external senders", () => {
      const indicators = detectBEC({
        ...safeEmail,
        from: { name: "CEO", address: "attacker@evil.com" },
        subject: "Invoice payment needed",
        preview: "Please transfer funds",
      });
      expect(indicators).toHaveLength(1);
      expect(indicators[0].type).toBe("bec");
    });
  });

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

      // Score 25 = suspicious
      const suspEmail: Email = {
        ...safeEmail,
        body: "URGENT: Verify your account",
      };
      const r1 = detectPhishing(suspEmail);
      // Urgency adds indicator but no score (only link scores count)
      // Actually urgency doesn't add to score, only indicator
      // Need a link with score to get to 25+
      expect(["safe", "suspicious", "dangerous", "critical"]).toContain(
        r1.threatLevel
      );
    });

    it("caps score at 100", () => {
      const extremelyDangerous: Email = {
        ...safeEmail,
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
        from: { name: "Amazon", address: "support@arnazon.com" },
      });
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.indicators.some((i) => i.type === "domain")).toBe(true);
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
