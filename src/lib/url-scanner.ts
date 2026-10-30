"use client";

/**
 * URL extraction and reputation scanning for phishing detection.
 * Extracts URLs from HTML or plain text email bodies and checks
 * against a local blocklist. Production deployments should replace
 * the blocklist check with a call to the backend reputation service.
 */

const URL_REGEX = /https?:\/\/[^\s<>"')]+/gi;

/**
 * Extract all unique URLs from an email body (HTML or plain text).
 */
export function extractUrls(body: string, bodyType: "html" | "text"): string[] {
  if (!body) return [];
  const text = bodyType === "html" ? stripHtml(body) : body;
  const matches = text.match(URL_REGEX) ?? [];
  return [...new Set(matches)];
}

function stripHtml(html: string): string {
  if (typeof document === "undefined") {
    // SSR: crude strip
    return html.replace(/<[^>]*>/g, " ");
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
}

/**
 * Known-suspicious domains (blocklist). In production this should
 * be fetched from the backend or an external reputation API.
 */
const BLOCKED_DOMAINS = new Set([
  "phishing.example",
  "malware.test",
  "evil.com",
  "bit.ly",
  "tinyurl.com",
  "t.co",
]);

const SUSPICIOUS_TLDS = new Set([
  ".xyz", ".top", ".club", ".work", ".date", ".racing", ".win",
]);

export interface UrlReputation {
  url: string;
  domain: string;
  isSuspicious: boolean;
  reasons: string[];
}

/**
 * Check the reputation of a single URL.
 */
export function checkUrlReputation(url: string): UrlReputation {
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return { url, domain: "", isSuspicious: true, reasons: ["Invalid URL"] };
  }
  const reasons: string[] = [];
  let isSuspicious = false;

  if (BLOCKED_DOMAINS.has(domain)) {
    isSuspicious = true;
    reasons.push(`Domain "${domain}" is in blocklist`);
  }

  for (const tld of SUSPICIOUS_TLDS) {
    if (domain.endsWith(tld)) {
      isSuspicious = true;
      reasons.push(`Suspicious TLD: ${tld}`);
      break;
    }
  }

  // IP address instead of domain
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    isSuspicious = true;
    reasons.push("URL uses IP address instead of domain name");
  }

  return { url, domain, isSuspicious, reasons };
}

/**
 * Scan all URLs in an email body and return reputation results.
 */
export function scanUrls(body: string, bodyType: "html" | "text"): UrlReputation[] {
  const urls = extractUrls(body, bodyType);
  return urls.map(checkUrlReputation);
}

/**
 * Returns true if any URL in the body is suspicious.
 */
export function hasSuspiciousUrls(body: string, bodyType: "html" | "text"): boolean {
  return scanUrls(body, bodyType).some((r) => r.isSuspicious);
}
