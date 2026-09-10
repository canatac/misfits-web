/**
 * Unit tests for newsletter AI summary.
 */
import { describe, it, expect } from "vitest";
import {
  detectNewsletter,
  isNewsletterEmail,
  generateNewsletterSummary,
  cacheSummary,
  getCachedSummary,
  hasCachedSummary,
  clearSummaryCache,
  getCacheSize,
  formatReadingTime,
  getNewsletterBadgeText,
  extractUnsubscribeUrl,
  canBatchSummarize,
  generateBatchSummary,
} from "@/lib/newsletter-summary";

describe("newsletter-summary", () => {
  describe("detectNewsletter", () => {
    it("detects newsletter via List-Unsubscribe", () => {
      const detection = detectNewsletter({ "list-unsubscribe": "<mailto:unsub@example.com>" });
      expect(detection.isNewsletter).toBe(true);
      expect(detection.confidence).toBeGreaterThan(0);
    });

    it("detects newsletter via List-Id", () => {
      const detection = detectNewsletter({ "list-id": "Newsletter <news.example.com>" });
      expect(detection.isNewsletter).toBe(true);
    });

    it("detects newsletter via precedence bulk", () => {
      const detection = detectNewsletter({ precedence: "bulk" });
      expect(detection.isNewsletter).toBe(true);
    });

    it("returns false for non-newsletter", () => {
      const detection = detectNewsletter({});
      expect(detection.isNewsletter).toBe(false);
    });
  });

  describe("isNewsletterEmail", () => {
    it("returns true for newsletter", () => {
      expect(isNewsletterEmail({ "list-unsubscribe": "<mailto:unsub@example.com>" })).toBe(true);
    });

    it("returns false for non-newsletter", () => {
      expect(isNewsletterEmail({})).toBe(false);
    });
  });

  describe("generateNewsletterSummary", () => {
    it("generates summary with key points", () => {
      const summary = generateNewsletterSummary("e1", "Test Newsletter", "<p>This is a key point. Another important point.</p>");
      expect(summary.emailId).toBe("e1");
      expect(summary.keyPoints.length).toBeGreaterThan(0);
      expect(summary.estimatedReadingTime).toBeGreaterThan(0);
    });

    it("extracts notable links", () => {
      const summary = generateNewsletterSummary("e1", "Test", '<p>Check <a href="https://example.com">this link</a></p>');
      expect(summary.notableLinks.length).toBeGreaterThan(0);
    });
  });

  describe("cacheSummary", () => {
    it("caches summary", () => {
      const cache = new Map();
      const summary = generateNewsletterSummary("e1", "Test", "<p>Test</p>");
      const newCache = cacheSummary(cache, summary);
      expect(newCache.has("e1")).toBe(true);
      expect(newCache.get("e1")?.cached).toBe(true);
    });
  });

  describe("getCachedSummary", () => {
    it("returns cached summary", () => {
      const cache = new Map();
      const summary = generateNewsletterSummary("e1", "Test", "<p>Test</p>");
      const newCache = cacheSummary(cache, summary);
      expect(getCachedSummary(newCache, "e1")).toBeDefined();
    });

    it("returns undefined for missing", () => {
      const cache = new Map();
      expect(getCachedSummary(cache, "e1")).toBeUndefined();
    });
  });

  describe("hasCachedSummary", () => {
    it("returns true for cached", () => {
      const cache = new Map();
      const summary = generateNewsletterSummary("e1", "Test", "<p>Test</p>");
      const newCache = cacheSummary(cache, summary);
      expect(hasCachedSummary(newCache, "e1")).toBe(true);
    });
  });

  describe("clearSummaryCache", () => {
    it("clears cache", () => {
      let cache = new Map();
      const summary = generateNewsletterSummary("e1", "Test", "<p>Test</p>");
      cache = cacheSummary(cache, summary);
      cache = clearSummaryCache();
      expect(cache.size).toBe(0);
    });
  });

  describe("getCacheSize", () => {
    it("returns correct size", () => {
      let cache = new Map();
      expect(getCacheSize(cache)).toBe(0);
      const summary = generateNewsletterSummary("e1", "Test", "<p>Test</p>");
      cache = cacheSummary(cache, summary);
      expect(getCacheSize(cache)).toBe(1);
    });
  });

  describe("formatReadingTime", () => {
    it("formats less than 1 min", () => {
      expect(formatReadingTime(0)).toBe("Less than 1 min");
    });

    it("formats 1 min", () => {
      expect(formatReadingTime(1)).toBe("1 min read");
    });

    it("formats multiple mins", () => {
      expect(formatReadingTime(5)).toBe("5 min read");
    });
  });

  describe("getNewsletterBadgeText", () => {
    it("returns empty for non-newsletter", () => {
      const detection = detectNewsletter({});
      expect(getNewsletterBadgeText(detection)).toBe("");
    });

    it("returns Newsletter for high confidence", () => {
      const detection = detectNewsletter({ "list-unsubscribe": "<mailto:unsub@example.com>", "list-id": "test" });
      expect(getNewsletterBadgeText(detection)).toBe("Newsletter");
    });
  });

  describe("extractUnsubscribeUrl", () => {
    it("extracts URL from header", () => {
      const url = extractUnsubscribeUrl({ "list-unsubscribe": "<mailto:unsub@example.com>" });
      expect(url).toBe("mailto:unsub@example.com");
    });

    it("returns undefined for missing header", () => {
      const url = extractUnsubscribeUrl({});
      expect(url).toBeUndefined();
    });
  });

  describe("canBatchSummarize", () => {
    it("returns true for multiple emails", () => {
      expect(canBatchSummarize(["e1", "e2"], new Map())).toBe(true);
    });

    it("returns false for single email", () => {
      expect(canBatchSummarize(["e1"], new Map())).toBe(false);
    });
  });

  describe("generateBatchSummary", () => {
    it("generates batch summary", () => {
      let cache = new Map();
      const s1 = generateNewsletterSummary("e1", "Test1", "<p>Point 1</p>");
      const s2 = generateNewsletterSummary("e2", "Test2", "<p>Point 2</p>");
      cache = cacheSummary(cache, s1);
      cache = cacheSummary(cache, s2);
      const batch = generateBatchSummary(["e1", "e2"], cache);
      expect(batch.totalEmails).toBe(2);
      expect(batch.allKeyPoints.length).toBeGreaterThan(0);
    });
  });
});
