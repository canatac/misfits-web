/**
 * Phishing detection engine — rule-based analysis with AI enhancement.
 */
import type { Email } from "@/types/email";
import type {
  PhishingResult,
  SecurityIndicator,
  HeaderAnalysis,
  SuspiciousLink,
  ThreatLevel,
} from "@/types/security";
import { chatCompletionDirect } from "@/lib/ai-client";
import type { ChatMessage } from "@/types/ai";

const URGENCY_PATTERNS = [
  /\burgent\b/i,
  /\basap\b/i,
  /\bimmediately\b/i,
  /\bact now\b/i,
  /\bverify your account\b/i,
  /\bclick here\b/i,
  /\bsuspend/i,
  /\bdeadline\b/i,
  /\byou must\b/i,
  /\bfinal notice\b/i,
  /\baccount will be\b/i,
];

const PHISHING_DOMAINS = [
  "paypa1.com",
  "g00gle.com",
  "arnazon.com",
  "micros0ft.com",
  "app1e.com",
];

export function analyzeLinks(html: string): SuspiciousLink[] {
  const links: SuspiciousLink[] = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    // Iteratively strip <script> blocks before extracting plain text, to prevent
    // incomplete multi-character sanitization bypasses.
    let rawDisplay = match[2];
    let prev: string;
    do {
      prev = rawDisplay;
      rawDisplay = rawDisplay.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi, "");
    } while (rawDisplay !== prev);
    // Strip all remaining angle-bracket characters so no partial <script can survive.
    const display = rawDisplay.replace(/[<>]/g, "");
    let riskScore = 0;
    const reasons: string[] = [];
    if (/^\d+\.\d+\.\d+\.\d+/.test(url)) {
      riskScore += 30;
      reasons.push("IP address URL");
    }
    if (url.includes("xn--")) {
      riskScore += 40;
      reasons.push("Punycode (homoglyph)");
    }
    if (display && !url.includes(display) && !display.startsWith("http")) {
      riskScore += 20;
      reasons.push("Display text doesn't match URL");
    }
    if (riskScore > 0)
      links.push({
        url,
        displayText: display,
        reason: reasons.join(", "),
        riskScore,
      });
  }
  return links;
}

export function analyzeHeaders(
  headers?: Record<string, string>
): HeaderAnalysis {
  const details: string[] = [];
  const get = (k: string) => headers?.[k] || headers?.[k.toLowerCase()];
  const spfRaw = get("Received-SPF") || get("Authentication-Results") || "";
  const dkimRaw = get("DKIM-Signature") || get("Authentication-Results") || "";
  const dmarcRaw = get("Authentication-Results") || "";

  const spf: "pass" | "fail" | "none" = spfRaw.includes("pass")
    ? "pass"
    : spfRaw.includes("fail")
      ? "fail"
      : "none";
  const dkim: "pass" | "fail" | "none" = dkimRaw.includes("pass")
    ? "pass"
    : dkimRaw.includes("fail")
      ? "fail"
      : "none";
  const dmarc: "pass" | "fail" | "none" =
    dmarcRaw.includes("dmarc") && dmarcRaw.includes("pass") ? "pass" : "none";

  if (spf === "fail") details.push("SPF failed — sender IP not authorized");
  if (dkim === "fail") details.push("DKIM failed — signature invalid");
  if (dmarc === "none") details.push("DMARC not found");

  return { spf, dkim, dmarc, details };
}

export function detectTyposquatting(domain: string): boolean {
  return PHISHING_DOMAINS.some((d) => domain.includes(d));
}

export function detectUrgencyScam(body: string): SecurityIndicator[] {
  const indicators: SecurityIndicator[] = [];
  for (const pattern of URGENCY_PATTERNS) {
    if (pattern.test(body)) {
      indicators.push({
        type: "content",
        severity: "medium",
        description: "Urgency language detected",
        detail: `Matched: ${pattern.source}`,
      });
      break;
    }
  }
  return indicators;
}

export function detectBEC(email: Email): SecurityIndicator[] {
  const indicators: SecurityIndicator[] = [];
  const body = `${email.subject} ${email.preview}`.toLowerCase();
  if (
    /\b(wire|transfer|payment|invoice|ceo|boss|urgent request)\b/i.test(body)
  ) {
    if (
      !email.from.address.includes("@misfits.ai") ||
      email.from.name !== email.from.address
    ) {
      indicators.push({
        type: "bec",
        severity: "high",
        description: "Potential Business Email Compromise",
        detail: "Financial keywords + possible display name spoofing",
      });
    }
  }
  return indicators;
}

export function detectPhishing(email: Email): PhishingResult {
  const indicators: SecurityIndicator[] = [];
  let score = 0;

  const links = analyzeLinks(email.body);
  links.forEach((l) => {
    score += l.riskScore;
    indicators.push({
      type: "link",
      severity: l.riskScore >= 40 ? "high" : "medium",
      description: `Suspicious link: ${l.reason}`,
      detail: l.url,
    });
  });

  indicators.push(...detectUrgencyScam(email.body));
  indicators.push(...detectBEC(email));
  if (detectTyposquatting(email.from.address)) {
    score += 30;
    indicators.push({
      type: "domain",
      severity: "critical",
      description: "Typosquatting domain detected",
    });
  }

  const headerAnalysis = analyzeHeaders(email.headers);
  if (headerAnalysis.spf === "fail") {
    score += 20;
    indicators.push({
      type: "header",
      severity: "high",
      description: "SPF failed",
    });
  }
  if (headerAnalysis.dkim === "fail") {
    score += 20;
    indicators.push({
      type: "header",
      severity: "high",
      description: "DKIM failed",
    });
  }

  score = Math.min(100, score);
  let threatLevel: ThreatLevel = "safe";
  if (score >= 70) threatLevel = "critical";
  else if (score >= 50) threatLevel = "dangerous";
  else if (score >= 25) threatLevel = "suspicious";

  return {
    emailId: email.id,
    threatLevel,
    score,
    reasons: indicators.map((i) => i.description),
    indicators,
    suspiciousLinks: links,
    headers: headerAnalysis,
    scannedAt: new Date().toISOString(),
    aiAssisted: false,
  };
}
