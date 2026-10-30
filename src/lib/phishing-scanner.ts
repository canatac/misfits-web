export type ThreatLevel = "safe" | "low" | "medium" | "high";

export interface PhishingIndicator {
  type: "domain" | "url" | "attachment" | "spoofing";
  detail: string;
  severity: ThreatLevel;
}

export interface PhishingScanResult {
  threatLevel: ThreatLevel;
  score: number;
  indicators: PhishingIndicator[];
  scannedAt: string;
}

const SUSPICIOUS_TLDS = ["xyz", "top", "click", "work", "buzz", "info"];
const DANGEROUS_EXTENSIONS = [".exe", ".scr", ".js", ".vbs", ".bat", ".cmd", ".ps1", ".msi"];
const TRUSTED_DOMAINS = [
  "google.com", "gmail.com", "microsoft.com", "outlook.com",
  "apple.com", "icloud.com", "proton.me", "protonmail.com",
];

export type SensitivityLevel = "low" | "medium" | "high";

const SENSITIVITY_THRESHOLD: Record<SensitivityLevel, number> = {
  low: 70,
  medium: 40,
  high: 20,
};

function scoreForLevel(level: ThreatLevel): number {
  switch (level) {
    case "high": return 80;
    case "medium": return 50;
    case "low": return 20;
    default: return 0;
  }
}

function checkDomainReputation(domain: string): PhishingIndicator | null {
  const lower = domain.toLowerCase();
  if (TRUSTED_DOMAINS.some((t) => lower === t || lower.endsWith("." + t))) return null;
  const tld = lower.split(".").pop() ?? "";
  if (SUSPICIOUS_TLDS.includes(tld)) {
    return { type: "domain", detail: `Suspicious TLD .${tld}`, severity: "medium" };
  }
  if (lower.includes("login") || lower.includes("verify") || lower.includes("account") || lower.includes("secure")) {
    return { type: "domain", detail: "Domain mimics login/verification page", severity: "medium" };
  }
  return null;
}

function checkTyposquatting(domain: string): PhishingIndicator | null {
  const lower = domain.toLowerCase();
  const homoglyphs: Record<string, string> = { "g00gle": "google", "paypa1": "paypal", "amaz0n": "amazon", "micr0soft": "microsoft" };
  for (const [spoof, real] of Object.entries(homoglyphs)) {
    if (lower.includes(spoof)) {
      return { type: "domain", detail: `Possible typosquatting of ${real}`, severity: "high" };
    }
  }
  return null;
}

function checkUrls(body: string, bodyType: "html" | "text"): PhishingIndicator[] {
  const indicators: PhishingIndicator[] = [];
  const urlPattern = /https?:\/\/[^\s<>"']+/gi;
  const text = bodyType === "html" ? body.replace(/<[^>]*>/g, " ") : body;
  const urls = text.match(urlPattern) ?? [];
  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname;
      const domainCheck = checkDomainReputation(hostname);
      if (domainCheck) indicators.push(domainCheck);
      const typoCheck = checkTyposquatting(hostname);
      if (typoCheck) indicators.push(typoCheck);
      if (url.includes("@") && url.indexOf("@") > url.indexOf("://") + 5) {
        indicators.push({ type: "url", detail: "URL contains credential-like @ pattern", severity: "high" });
      }
    } catch {
      indicators.push({ type: "url", detail: `Malformed URL: ${url}`, severity: "low" });
    }
  }
  return indicators;
}

function checkAttachments(attachments: { filename: string }[]): PhishingIndicator[] {
  const indicators: PhishingIndicator[] = [];
  for (const att of attachments) {
    const lower = att.filename.toLowerCase();
    for (const ext of DANGEROUS_EXTENSIONS) {
      if (lower.endsWith(ext)) {
        indicators.push({ type: "attachment", detail: `Dangerous file type: ${ext} (${att.filename})`, severity: "high" });
        break;
      }
    }
  }
  return indicators;
}

function checkSpoofing(from: { name: string; address: string }, headers: Record<string, string>): PhishingIndicator[] {
  const indicators: PhishingIndicator[] = [];
  const fromDomain = from.address.split("@")[1]?.toLowerCase() ?? "";
  if (TRUSTED_DOMAINS.some((t) => fromDomain === t || fromDomain.endsWith("." + t))) return indicators;
  const replyTo = headers["reply-to"] ?? "";
  if (replyTo) {
    const replyDomain = replyTo.split("@")[1]?.toLowerCase() ?? "";
    if (replyDomain && replyDomain !== fromDomain) {
      indicators.push({ type: "spoofing", detail: `Reply-To domain (${replyDomain}) differs from From domain (${fromDomain})`, severity: "medium" });
    }
  }
  return indicators;
}

export interface PhishingScanInput {
  from: { name: string; address: string };
  body: string;
  bodyType: "html" | "text";
  attachments?: { filename: string }[];
  headers?: Record<string, string>;
  sensitivity?: SensitivityLevel;
}

export function scanForPhishing(input: PhishingScanInput): PhishingScanResult {
  const indicators: PhishingIndicator[] = [];
  const domain = input.from.address.split("@")[1] ?? "";
  const domainCheck = checkDomainReputation(domain);
  if (domainCheck) indicators.push(domainCheck);
  const typoCheck = checkTyposquatting(domain);
  if (typoCheck) indicators.push(typoCheck);
  indicators.push(...checkUrls(input.body, input.bodyType));
  indicators.push(...checkAttachments(input.attachments ?? []));
  indicators.push(...checkSpoofing(input.from, input.headers ?? {}));
  const maxIndicator = indicators.reduce<ThreatLevel>((max, i) => {
    const order: ThreatLevel[] = ["safe", "low", "medium", "high"];
    return order.indexOf(i.severity) > order.indexOf(max) ? i.severity : max;
  }, "safe");
  const rawScore = indicators.reduce((sum, i) => sum + scoreForLevel(i.severity), 0);
  const score = Math.min(100, rawScore);
  const threshold = SENSITIVITY_THRESHOLD[input.sensitivity ?? "medium"];
  const effectiveLevel: ThreatLevel = score >= threshold ? (score >= 70 ? "high" : score >= 40 ? "medium" : "low") : "safe";
  return { threatLevel: effectiveLevel, score, indicators, scannedAt: new Date().toISOString() };
}
