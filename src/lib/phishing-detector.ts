/**
 * Phishing detector — heuristic-based risk scoring for incoming emails.
 *
 * Produces a PhishingResult (score 0-100, threat level, indicators) used by
 * the security indicator in the list view, the email view header, and the
 * security dashboard.
 *
 * This is a client-side heuristic layer. In production it would be backed by
 * the Hermes AI analysis pipeline (see issue #505).
 */

import type { Email } from "@/types/email";
import type {
  PhishingResult,
  SecurityIndicator,
  ThreatLevel,
  SuspiciousLink,
  HeaderAnalysis,
} from "@/types/security";

/** Domain reputation — known-safe vs known-suspicious patterns. */
const TRUSTED_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "protonmail.com",
  "icloud.com",
  "google.com",
  "microsoft.com",
  "apple.com",
  "amazonses.com",
  "mailgun.org",
  "sendgrid.net",
]);

const SUSPICIOUS_TLDS = new Set([
  ".xyz", ".top", ".club", ".online", ".site", ".icu", ".buzz", ".click",
  ".work", ".rest", ".loan", ".men", ".win", ".stream", ".download",
]);

/** Keywords that signal urgency or social engineering. */
const URGENCY_PATTERNS = [
  /urgent/i, /immediate(ly)?/i, /action required/i, /verify your account/i,
  /suspend/i, /locked/i, /unusual activity/i, /confirm your/i,
  /update your payment/i, /invoice attached/i, /wire transfer/i,
  /bank account/i, /social security/i, /ssn/i, /password/i,
  /click here/i, /click below/i, /log in to/i, /sign in to/i,
];

/** Regex for extracting URLs from text. */
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

/** Regex for extracting email addresses from text. */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

function extractLinks(body: string): string[] {
  return body.match(URL_REGEX) || [];
}

function extractEmails(text: string): string[] {
  return text.match(EMAIL_REGEX) || [];
}

function getDomain(emailOrUrl: string): string {
  try {
    if (emailOrUrl.includes("@")) {
      return emailOrUrl.split("@")[1].toLowerCase();
    }
    const url = new URL(emailOrUrl);
    return url.hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isTrustedDomain(domain: string): boolean {
  const parts = domain.toLowerCase().split(".");
  if (parts.length >= 2) {
    const base = parts.slice(-2).join(".");
    if (TRUSTED_DOMAINS.has(base)) return true;
    if (TRUSTED_DOMAINS.has(domain)) return true;
  }
  return TRUSTED_DOMAINS.has(domain.toLowerCase());
}

function hasSuspiciousTld(domain: string): boolean {
  const lower = domain.toLowerCase();
  for (const tld of SUSPICIOUS_TLDS) {
    if (lower.endsWith(tld)) return true;
  }
  return false;
}

/**
 * Analyze links in the body for mismatched display text, URL obfuscation,
 * and suspicious destinations.
 */
function analyzeLinks(body: string): {
  links: SuspiciousLink[];
  indicators: SecurityIndicator[];
} {
  const links: SuspiciousLink[] = [];
  const indicators: SecurityIndicator[] = [];
  const urls = extractLinks(body);

  for (const url of urls) {
    const domain = getDomain(url);
    let riskScore = 0;
    const reasons: string[] = [];

    // Check for IP address instead of domain
    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
      riskScore += 30;
      reasons.push("URL uses IP address instead of domain name");
    }

    // Check for URL shorteners
    if (/bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd/i.test(url)) {
      riskScore += 20;
      reasons.push("URL uses a link shortener");
    }

    // Check for suspicious TLD
    if (domain && hasSuspiciousTld(domain)) {
      riskScore += 25;
      reasons.push(`Suspicious top-level domain: ${domain}`);
    }

    // Check for @ in URL (credential stuffing trick)
    if (url.includes("@") && !url.startsWith("mailto:")) {
      riskScore += 35;
      reasons.push("URL contains @ symbol (credential obfuscation)");
    }

    // Check for excessive subdomains
    if (domain && domain.split(".").length > 4) {
      riskScore += 15;
      reasons.push("Excessive subdomains");
    }

    // Check for non-standard port
    if (/:\d{2,5}\//.test(url) && !/:443\//.test(url) && !/:80\//.test(url)) {
      riskScore += 10;
      reasons.push("Non-standard port in URL");
    }

    // Check for hex/encoded obfuscation
    if (/%[0-9a-fA-F]{2}/.test(url)) {
      riskScore += 10;
      reasons.push("URL contains encoded characters");
    }

    if (riskScore > 0) {
      links.push({
        url,
        reason: reasons.join("; ") || "Suspicious link",
        riskScore: Math.min(riskScore, 100),
      });
      indicators.push({
        type: "link",
        severity: riskScore >= 30 ? "high" : riskScore >= 15 ? "medium" : "low",
        description: `Suspicious link: ${domain || "unknown"}`,
        detail: reasons.join("; "),
      });
    }
  }

  return { links, indicators };
}

/**
 * Analyze email content for phishing signals.
 */
function analyzeContent(email: Email): SecurityIndicator[] {
  const indicators: SecurityIndicator[] = [];
  const text = `${email.subject} ${email.preview} ${email.body}`;

  // Check for urgency patterns
  let urgencyCount = 0;
  for (const pattern of URGENCY_PATTERNS) {
    if (pattern.test(text)) urgencyCount++;
  }
  if (urgencyCount >= 3) {
    indicators.push({
      type: "content",
      severity: "high",
      description: "Multiple urgency/social engineering patterns detected",
      detail: `${urgencyCount} urgency indicators found in subject and body`,
    });
  } else if (urgencyCount >= 1) {
    indicators.push({
      type: "content",
      severity: "medium",
      description: "Urgency language detected",
      detail: `${urgencyCount} urgency indicator(s) found`,
    });
  }

  // Check for requests for sensitive info
  if (/(password|credit card|ssn|social security|bank account)/i.test(text)) {
    indicators.push({
      type: "content",
      severity: "high",
      description: "Requests for sensitive information",
      detail: "Email contains requests for passwords, financial, or personal data",
    });
  }

  // Check for mismatched reply-to
  if (email.replyTo && email.replyTo.address) {
    const fromDomain = getDomain(email.from.address);
    const replyDomain = getDomain(email.replyTo.address);
    if (fromDomain && replyDomain && fromDomain !== replyDomain) {
      indicators.push({
        type: "sender",
        severity: "high",
        description: "Reply-To domain mismatch",
        detail: `From domain (${fromDomain}) differs from Reply-To domain (${replyDomain})`,
      });
    }
  }

  // Check for display name spoofing
  if (email.from.name && email.from.address) {
    const nameLower = email.from.name.toLowerCase();
    const addrLower = email.from.address.toLowerCase();
    // Display name looks like an email address different from actual sender
    if (email.from.name.includes("@") && !addrLower.includes(nameLower.split("@")[0])) {
      indicators.push({
        type: "sender",
        severity: "critical",
        description: "Display name spoofing detected",
        detail: `Display name "${email.from.name}" does not match sender address "${email.from.address}"`,
      });
    }
  }

  return indicators;
}

/**
 * Analyze sender reputation.
 */
function analyzeSender(email: Email): SecurityIndicator[] {
  const indicators: SecurityIndicator[] = [];
  const domain = getDomain(email.from.address);

  if (!domain) {
    indicators.push({
      type: "sender",
      severity: "medium",
      description: "Cannot determine sender domain",
    });
    return indicators;
  }

  if (hasSuspiciousTld(domain)) {
    indicators.push({
      type: "domain",
      severity: "high",
      description: `Suspicious sender domain TLD: ${domain}`,
    });
  }

  if (!isTrustedDomain(domain)) {
    // Not necessarily phishing, but flag as unknown
    indicators.push({
      type: "domain",
      severity: "low",
      description: `Unrecognized sender domain: ${domain}`,
    });
  }

  return indicators;
}

/**
 * Analyze authentication headers (SPF/DKIM/DMARC).
 */
function analyzeHeaders(email: Email): {
  analysis: HeaderAnalysis;
  indicators: SecurityIndicator[];
} {
  const indicators: SecurityIndicator[] = [];
  const headers = email.headers || {};

  const spf = (headers["spf"] || headers["Received-SPF"] || "none").toLowerCase();
  const dkim = (headers["dkim"] || headers["DKIM-Signature"] ? "pass" : "none").toLowerCase();
  const dmarc = (headers["dmarc"] || headers["Authentication-Results"] || "none").toLowerCase();

  const analysis: HeaderAnalysis = {
    spf: spf.includes("pass") ? "pass" : spf.includes("fail") ? "fail" : "none",
    dkim: dkim.includes("pass") || headers["DKIM-Signature"] ? "pass" : "none",
    dmarc: dmarc.includes("pass") ? "pass" : dmarc.includes("fail") ? "fail" : "none",
    details: [],
  };

  if (analysis.spf === "fail") {
    indicators.push({
      type: "header",
      severity: "high",
      description: "SPF check failed",
      detail: "Sender not authorized to send from this domain",
    });
  }
  if (analysis.dkim === "none") {
    indicators.push({
      type: "header",
      severity: "low",
      description: "No DKIM signature",
    });
  }
  if (analysis.dmarc === "fail") {
    indicators.push({
      type: "header",
      severity: "high",
      description: "DMARC check failed",
    });
  }

  return { analysis, indicators };
}

/**
 * Compute overall threat level from score.
 */
function scoreToThreat(score: number): ThreatLevel {
  if (score >= 70) return "critical";
  if (score >= 50) return "dangerous";
  if (score >= 25) return "suspicious";
  return "safe";
}

/**
 * Main entry point: scan an email and produce a PhishingResult.
 */
export function scanEmail(email: Email): PhishingResult {
  const allIndicators: SecurityIndicator[] = [];

  // Run all analyzers
  const contentIndicators = analyzeContent(email);
  const senderIndicators = analyzeSender(email);
  const { analysis: headerAnalysis, indicators: headerIndicators } = analyzeHeaders(email);
  const { links: suspiciousLinks, indicators: linkIndicators } = analyzeLinks(email.body);

  allIndicators.push(...contentIndicators, ...senderIndicators, ...headerIndicators, ...linkIndicators);

  // Calculate score
  let score = 0;
  for (const indicator of allIndicators) {
    switch (indicator.severity) {
      case "critical": score += 40; break;
      case "high": score += 25; break;
      case "medium": score += 15; break;
      case "low": score += 5; break;
      case "info": score += 1; break;
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  const threatLevel = scoreToThreat(score);

  // Build reasons
  const reasons: string[] = [];
  if (suspiciousLinks.length > 0) {
    reasons.push(`${suspiciousLinks.length} suspicious link(s) detected`);
  }
  const highSeverity = allIndicators.filter((i) => i.severity === "high" || i.severity === "critical");
  if (highSeverity.length > 0) {
    reasons.push(`${highSeverity.length} high-severity indicator(s)`);
  }
  if (score < 25) {
    reasons.push("No significant threats detected");
  }

  return {
    emailId: email.id,
    threatLevel,
    score,
    reasons,
    indicators: allIndicators,
    suspiciousLinks,
    headers: headerAnalysis,
    scannedAt: new Date().toISOString(),
    aiAssisted: false,
  };
}

/**
 * Get recommended action for a threat level.
 */
export function getRecommendedAction(threatLevel: ThreatLevel): string {
  switch (threatLevel) {
    case "critical": return "Do not interact. Report as phishing immediately.";
    case "dangerous": return "Avoid clicking links. Verify sender through another channel.";
    case "suspicious": return "Exercise caution. Do not share personal information.";
    case "safe": return "No action needed.";
  }
}

/** Backwards-compatible alias for scanEmail. */
export const detectPhishing = scanEmail;
