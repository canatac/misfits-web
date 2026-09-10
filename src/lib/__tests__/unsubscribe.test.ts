/**
 * Unit tests for one-click unsubscribe utility.
 */
import { describe, it, expect } from "vitest";
import {
  generateListUnsubscribeHeader,
  generateOneClickUnsubscribeHeader,
  parseListUnsubscribeHeader,
  hasUnsubscribeHeader,
  generateUnsubscribeConfirmation,
  generateUnsubscribeUrl,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  createUnsubscribeLogEntry,
  checkUnsubscribeCompliance,
} from "@/lib/unsubscribe";

describe("unsubscribe", () => {
  describe("generateListUnsubscribeHeader", () => {
    it("generates mailto header", () => {
      const header = generateListUnsubscribeHeader({ mailto: "unsub@example.com" });
      expect(header).toBe("<mailto:unsub@example.com>");
    });

    it("generates URL header", () => {
      const header = generateListUnsubscribeHeader({ url: "https://example.com/unsub" });
      expect(header).toBe("<https://example.com/unsub>");
    });

    it("generates combined header", () => {
      const header = generateListUnsubscribeHeader({
        mailto: "unsub@example.com",
        url: "https://example.com/unsub",
      });
      expect(header).toBe("<mailto:unsub@example.com>, <https://example.com/unsub>");
    });
  });

  describe("generateOneClickUnsubscribeHeader", () => {
    it("generates one-click header", () => {
      const header = generateOneClickUnsubscribeHeader({
        mailto: "unsub@example.com",
        url: "https://example.com/unsub",
        postData: "list=newsletter",
      });
      expect(header).toContain("<mailto:unsub@example.com>");
      expect(header).toContain("(One-Click)");
    });
  });

  describe("parseListUnsubscribeHeader", () => {
    it("parses mailto method", () => {
      const results = parseListUnsubscribeHeader("<mailto:unsub@example.com>");
      expect(results).toHaveLength(1);
      expect(results[0].method).toBe("mailto");
      expect(results[0].url).toBe("mailto:unsub@example.com");
    });

    it("parses https method", () => {
      const results = parseListUnsubscribeHeader("<https://example.com/unsub>");
      expect(results).toHaveLength(1);
      expect(results[0].method).toBe("https");
      expect(results[0].url).toBe("https://example.com/unsub");
    });

    it("parses multiple methods", () => {
      const results = parseListUnsubscribeHeader("<mailto:unsub@example.com>, <https://example.com/unsub>");
      expect(results).toHaveLength(2);
    });

    it("detects one-click", () => {
      const results = parseListUnsubscribeHeader("<https://example.com/unsub> (One-Click)");
      expect(results[0].isOneClick).toBe(true);
    });
  });

  describe("hasUnsubscribeHeader", () => {
    it("returns true for mailto", () => {
      expect(hasUnsubscribeHeader("<mailto:unsub@example.com>")).toBe(true);
    });

    it("returns true for URL", () => {
      expect(hasUnsubscribeHeader("<https://example.com/unsub>")).toBe(true);
    });

    it("returns false for undefined", () => {
      expect(hasUnsubscribeHeader(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(hasUnsubscribeHeader("")).toBe(false);
    });
  });

  describe("generateUnsubscribeConfirmation", () => {
    it("generates confirmation with list name", () => {
      const body = generateUnsubscribeConfirmation({
        recipientEmail: "user@example.com",
        listName: "Newsletter",
      });
      expect(body).toContain("Newsletter");
    });

    it("includes resubscribe URL when provided", () => {
      const body = generateUnsubscribeConfirmation({
        recipientEmail: "user@example.com",
        listName: "Newsletter",
        resubscribeUrl: "https://example.com/resub",
      });
      expect(body).toContain("https://example.com/resub");
    });

    it("includes timestamp", () => {
      const body = generateUnsubscribeConfirmation({
        recipientEmail: "user@example.com",
        listName: "Newsletter",
      });
      expect(body).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("generateUnsubscribeUrl", () => {
    it("generates URL with params", () => {
      const url = generateUnsubscribeUrl({
        baseUrl: "https://example.com",
        listId: "newsletter",
        recipientEmail: "user@example.com",
      });
      expect(url).toContain("https://example.com/unsubscribe");
      expect(url).toContain("list=newsletter");
      expect(url).toContain("email=user%40example.com");
    });

    it("includes token when provided", () => {
      const url = generateUnsubscribeUrl({
        baseUrl: "https://example.com",
        listId: "newsletter",
        recipientEmail: "user@example.com",
        token: "abc123",
      });
      expect(url).toContain("token=abc123");
    });
  });

  describe("generateUnsubscribeToken", () => {
    it("generates unique tokens", () => {
      const token1 = generateUnsubscribeToken("user@example.com", "list1");
      const token2 = generateUnsubscribeToken("user@example.com", "list1");
      expect(token1).not.toBe(token2); // Different timestamps
    });

    it("generates base64 token", () => {
      const token = generateUnsubscribeToken("user@example.com", "list1");
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe("verifyUnsubscribeToken", () => {
    it("verifies valid token", () => {
      const token = generateUnsubscribeToken("user@example.com", "list1");
      expect(verifyUnsubscribeToken(token, "user@example.com", "list1")).toBe(true);
    });

    it("rejects invalid token", () => {
      expect(verifyUnsubscribeToken("invalid", "user@example.com", "list1")).toBe(false);
    });

    it("rejects token for different email", () => {
      const token = generateUnsubscribeToken("user@example.com", "list1");
      expect(verifyUnsubscribeToken(token, "other@example.com", "list1")).toBe(false);
    });
  });

  describe("createUnsubscribeLogEntry", () => {
    it("creates log entry with id and timestamp", () => {
      const entry = createUnsubscribeLogEntry({
        emailId: "e1",
        listId: "list1",
        method: "mailto",
        success: true,
      });
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.emailId).toBe("e1");
      expect(entry.success).toBe(true);
    });
  });

  describe("checkUnsubscribeCompliance", () => {
    it("returns compliant when List-Unsubscribe present", () => {
      const result = checkUnsubscribeCompliance({
        hasListUnsubscribe: true,
        hasOneClick: true,
        isCommercial: true,
      });
      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("returns non-compliant when missing header", () => {
      const result = checkUnsubscribeCompliance({
        hasListUnsubscribe: false,
        hasOneClick: false,
        isCommercial: true,
      });
      expect(result.compliant).toBe(false);
      expect(result.issues).toContain("Missing List-Unsubscribe header (required for bulk senders)");
    });

    it("recommends one-click for commercial emails", () => {
      const result = checkUnsubscribeCompliance({
        hasListUnsubscribe: true,
        hasOneClick: false,
        isCommercial: true,
      });
      expect(result.recommendations).toContain(
        "Consider implementing one-click unsubscribe (RFC 8058) for commercial emails"
      );
    });
  });
});
