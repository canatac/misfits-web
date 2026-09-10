/**
 * Unit tests for phishing detector heuristic engine.
 */
import { describe, it, expect } from "vitest";
import { scanEmail, getRecommendedAction } from "@/lib/phishing-detector";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "test-1",
    threadId: "thread-1",
    folder: "inbox",
    from: { name: "Test Sender", address: "test@example.com" },
    to: [{ name: "Recipient", address: "recipient@example.com" }],
    subject: "Test Subject",
    preview: "Test preview",
    body: "<p>Test body</p>",
    bodyType: "html",
    date: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 1024,
    messageId: "<test@example.com>",
    ...overrides,
  };
}

describe("phishing-detector", () => {
  describe("scanEmail", () => {
    it("returns safe for a clean email", () => {
      const result = scanEmail(makeEmail());
      expect(result.threatLevel).toBe("safe");
      expect(result.score).toBe(0);
      expect(result.emailId).toBe("test-1");
    });

    it("flags suspicious TLD in sender domain", () => {
      const result = scanEmail(
        makeEmail({
          from: { name: "Scammer", address: "scam@evil.xyz" },
        })
      );
      expect(result.score).toBeGreaterThan(0);
      expect(result.indicators.some((i) => i.type === "domain")).toBe(true);
    });

    it("flags urgency language in subject", () => {
      const result = scanEmail(
        makeEmail({
          subject: "URGENT: Verify your account immediately - action required",
          preview: "Your account has been suspended. Click here to verify.",
          body: "<p>URGENT: Your account has been suspended. Verify your account immediately. Action required. Click here to verify your account.</p>",
        })
      );
      expect(result.score).toBeGreaterThanOrEqual(25);
      expect(result.threatLevel).toBe("suspicious");
    });

    it("flags suspicious links with IP addresses", () => {
      const result = scanEmail(
        makeEmail({
          body: '<p>Click <a href="http://192.168.1.1/login">here</a> to verify.</p>',
        })
      );
      expect(result.suspiciousLinks.length).toBeGreaterThan(0);
      expect(result.suspiciousLinks[0].riskScore).toBeGreaterThanOrEqual(30);
    });

    it("flags URL shorteners", () => {
      const result = scanEmail(
        makeEmail({
          body: '<p>See: https://bit.ly/abc123</p>',
        })
      );
      expect(result.suspiciousLinks.length).toBeGreaterThan(0);
    });

    it("flags display name spoofing", () => {
      const result = scanEmail(
        makeEmail({
          from: {
            name: "support@paypal.com",
            address: "attacker@evil.com",
          },
        })
      );
      const spoofIndicator = result.indicators.find(
        (i) => i.description.includes("spoofing")
      );
      expect(spoofIndicator).toBeDefined();
      expect(spoofIndicator?.severity).toBe("critical");
    });

    it("flags reply-to domain mismatch", () => {
      const result = scanEmail(
        makeEmail({
          from: { name: "Bank", address: "alert@bank.com" },
          replyTo: { name: "Bank", address: "reply@evil.com" },
        })
      );
      const mismatch = result.indicators.find(
        (i) => i.description.includes("mismatch")
      );
      expect(mismatch).toBeDefined();
    });

    it("flags requests for sensitive info", () => {
      const result = scanEmail(
        makeEmail({
          body: "<p>Please confirm your password and credit card number.</p>",
        })
      );
      const sensitive = result.indicators.find(
        (i) => i.description.includes("sensitive")
      );
      expect(sensitive).toBeDefined();
    });

    it("flags SPF failure", () => {
      const result = scanEmail(
        makeEmail({
          headers: { spf: "fail" },
        })
      );
      const spfFail = result.indicators.find(
        (i) => i.description.includes("SPF")
      );
      expect(spfFail).toBeDefined();
    });

    it("returns critical for multiple high-severity indicators", () => {
      const result = scanEmail(
        makeEmail({
          from: {
            name: "support@paypal.com",
            address: "attacker@evil.xyz",
          },
          subject: "URGENT: Verify your account immediately",
          body: '<p>URGENT: Verify your account. Click http://192.168.1.1/login now. Confirm your password and credit card.</p>',
        })
      );
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.threatLevel).toBe("critical");
    });

    it("caps score at 100", () => {
      const result = scanEmail(
        makeEmail({
          from: {
            name: "support@paypal.com",
            address: "a@b.xyz",
          },
          subject: "URGENT: Verify immediately - action required - account suspended",
          body: '<p>URGENT: Verify immediately. Action required. Account suspended. Click http://10.0.0.1/@evil.com:8080/%20%20/steal?user=admin@bank.com to confirm password and credit card and SSN. bit.ly/abc</p>',
          replyTo: { name: "Support", address: "reply@evil.com" },
        })
      );
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe("getRecommendedAction", () => {
    it("returns critical action for critical threat", () => {
      expect(getRecommendedAction("critical")).toContain("Report");
    });

    it("returns caution for suspicious", () => {
      expect(getRecommendedAction("suspicious")).toContain("caution");
    });

    it("returns no action for safe", () => {
      expect(getRecommendedAction("safe")).toContain("No action");
    });
  });
});
