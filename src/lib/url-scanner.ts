export interface UrlReputation {
  url: string;
  domain: string;
  isSuspicious: boolean;
  reasons: string[];
}

const BLOCKED_DOMAINS = ["phishing.example", "malware.test", "spam.evil"];
const TRUSTED_DOMAINS = ["google.com", "github.com", "microsoft.com", "apple.com", "proton.me"];

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;
const HTML_URL_REGEX = /href=["'](https?:\/\/[^\s<>"]+)["']/gi;

export function extractUrls(body: string, bodyType: "html" | "text"): string[] {
  if (!body) return [];
  const urls = new Set<string>();

  if (bodyType === "html") {
    let match;
    while ((match = HTML_URL_REGEX.exec(body)) !== null) {
      urls.add(match[1]);
    }
  }

  let match;
  while ((match = URL_REGEX.exec(body)) !== null) {
    urls.add(match[0]);
  }

  return Array.from(urls);
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "";
  }
}

function isIpAddress(domain: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain);
}

export function checkUrlReputation(url: string): UrlReputation {
  const domain = extractDomain(url);
  const reasons: string[] = [];

  if (!domain) {
    return { url, domain: "", isSuspicious: true, reasons: ["Invalid URL"] };
  }

  if (BLOCKED_DOMAINS.includes(domain)) {
    reasons.push("Domain is on blocklist");
  }

  if (isIpAddress(domain)) {
    reasons.push("IP-based URL (no domain name)");
  }

  if (TRUSTED_DOMAINS.includes(domain)) {
    return { url, domain, isSuspicious: false, reasons: [] };
  }

  if (domain.includes("phishing") || domain.includes("malware") || domain.includes("spam")) {
    reasons.push("Suspicious keywords in domain");
  }

  return {
    url,
    domain,
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

export function scanUrls(body: string, bodyType: "html" | "text"): UrlReputation[] {
  const urls = extractUrls(body, bodyType);
  return urls.map(checkUrlReputation);
}

export function hasSuspiciousUrls(body: string, bodyType: "html" | "text"): boolean {
  return scanUrls(body, bodyType).some((r) => r.isSuspicious);
}
