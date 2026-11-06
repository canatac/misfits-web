import { describe, it, expect } from "vitest";
import {
  extractUrls,
  checkUrlReputation,
  scanUrls,
  hasSuspiciousUrls,
} from "../url-scanner";

describe("extractUrls", () => {
  it("extracts URLs from plain text", () => {
    const text = "Check out https://example.com and https://test.org";
    expect(extractUrls(text, "text")).toEqual([
      "https://example.com",
      "https://test.org",
    ]);
  });

  it("extracts URLs from HTML", () => {
    const html = '<a href="https://example.com">Link</a> text https://other.com';
    const urls = extractUrls(html, "html");
    expect(urls).toContain("https://example.com");
  });

  it("deduplicates URLs", () => {
    const text = "Visit https://example.com and https://example.com again";
    expect(extractUrls(text, "text")).toEqual(["https://example.com"]);
  });

  it("returns empty array for empty body", () => {
    expect(extractUrls("", "text")).toEqual([]);
  });
});

describe("checkUrlReputation", () => {
  it("flags blocked domains", () => {
    const result = checkUrlReputation("https://phishing.example/login");
    expect(result.isSuspicious).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("flags IP-based URLs", () => {
    const result = checkUrlReputation("http://192.168.1.1/admin");
    expect(result.isSuspicious).toBe(true);
    expect(result.reasons.some((r) => r.includes("IP"))).toBe(true);
  });

  it("passes legitimate domains", () => {
    const result = checkUrlReputation("https://google.com/search");
    expect(result.isSuspicious).toBe(false);
    expect(result.reasons).toEqual([]);
  });

  it("flags invalid URLs", () => {
    const result = checkUrlReputation("not-a-url");
    expect(result.isSuspicious).toBe(true);
    expect(result.reasons).toContain("Invalid URL");
  });
});

describe("scanUrls", () => {
  it("scans all URLs in body", () => {
    const results = scanUrls("Visit https://google.com and https://phishing.example", "text");
    expect(results.length).toBe(2);
  });
});

describe("hasSuspiciousUrls", () => {
  it("returns true when suspicious URLs exist", () => {
    expect(hasSuspiciousUrls("Click https://phishing.example", "text")).toBe(true);
  });

  it("returns false for clean body", () => {
    expect(hasSuspiciousUrls("Visit https://google.com", "text")).toBe(false);
  });
});
