/**
 * Deliverability Checker (Issue #499).
 *
 * Verifies email compliance for Gmail/Yahoo bulk sender requirements (2026).
 * Checks SPF, DKIM, DMARC, PTR, TLS, and generates a compliance score.
 */

export type CheckStatus = "pass" | "fail" | "warn" | "not-checked";

export interface DNSRecordCheck {
  type: "SPF" | "DKIM" | "DMARC" | "PTR" | "TLS" | "TLS-RPT";
  status: CheckStatus;
  value?: string;
  issues: string[];
  recommendations: string[];
}

export interface DeliverabilityCheck {
  domain: string;
  timestamp: string;
  overallScore: number; // 0-100
  status: "compliant" | "partial" | "non-compliant";
  checks: DNSRecordCheck[];
  recommendations: string[];
}

export const CHECK_WEIGHTS: Record<DNSRecordCheck["type"], number> = {
  SPF: 20,
  DKIM: 20,
  DMARC: 25,
  PTR: 10,
  TLS: 15,
  "TLS-RPT": 10,
};

/**
 * Validate SPF record format.
 */
export function validateSPF(record: string | null): DNSRecordCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!record) {
    issues.push("No SPF record found");
    recommendations.push("Add an SPF record: v=spf1 include:_spf.misfits.ai ~all");
    return { type: "SPF", status: "fail", issues, recommendations };
  }

  if (!record.startsWith("v=spf1")) {
    issues.push("SPF record must start with 'v=spf1'");
    recommendations.push("Fix SPF record format");
    return { type: "SPF", status: "fail", value: record, issues, recommendations };
  }

  if (record.includes("+all")) {
    issues.push("SPF record uses '+all' (allows any sender)");
    recommendations.push("Use '~all' (softfail) or '-all' (hardfail) instead");
    return { type: "SPF", status: "warn", value: record, issues, recommendations };
  }

  if (record.includes("-all") || record.includes("~all")) {
    return { type: "SPF", status: "pass", value: record, issues, recommendations };
  }

  issues.push("SPF record missing 'all' mechanism");
  recommendations.push("Add '~all' or '-all' at the end of your SPF record");
  return { type: "SPF", status: "warn", value: record, issues, recommendations };
}

/**
 * Validate DMARC record format.
 */
export function validateDMARC(record: string | null): DNSRecordCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!record) {
    issues.push("No DMARC record found");
    recommendations.push("Add a DMARC record: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com");
    return { type: "DMARC", status: "fail", issues, recommendations };
  }

  if (!record.startsWith("v=DMARC1")) {
    issues.push("DMARC record must start with 'v=DMARC1'");
    recommendations.push("Fix DMARC record format");
    return { type: "DMARC", status: "fail", value: record, issues, recommendations };
  }

  if (!record.includes("p=")) {
    issues.push("DMARC record missing policy (p=)");
    recommendations.push("Add policy: p=none, p=quarantine, or p=reject");
    return { type: "DMARC", status: "warn", value: record, issues, recommendations };
  }

  if (record.includes("p=reject")) {
    return { type: "DMARC", status: "pass", value: record, issues, recommendations };
  }

  if (record.includes("p=quarantine")) {
    recommendations.push("Consider upgrading to p=reject for maximum protection");
    return { type: "DMARC", status: "pass", value: record, issues, recommendations };
  }

  if (record.includes("p=none")) {
    issues.push("DMARC policy is 'none' (no action taken)");
    recommendations.push("Upgrade to p=quarantine or p=reject");
    return { type: "DMARC", status: "warn", value: record, issues, recommendations };
  }

  return { type: "DMARC", status: "warn", value: record, issues, recommendations };
}

/**
 * Validate DKIM record presence.
 */
export function validateDKIM(selector: string, record: string | null): DNSRecordCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!record) {
    issues.push(`No DKIM record found for selector '${selector}'`);
    recommendations.push(`Add a DKIM record at ${selector}._domainkey.yourdomain.com`);
    return { type: "DKIM", status: "fail", issues, recommendations };
  }

  if (!record.includes("k=rsa") && !record.includes("k=ed25519")) {
    issues.push("DKIM record missing key type");
    recommendations.push("Add key type: k=rsa or k=ed25519");
    return { type: "DKIM", status: "warn", value: record, issues, recommendations };
  }

  if (!record.includes("p=")) {
    issues.push("DKIM record missing public key (p=)");
    recommendations.push("Add the public key in the DKIM record");
    return { type: "DKIM", status: "fail", value: record, issues, recommendations };
  }

  return { type: "DKIM", status: "pass", value: record, issues, recommendations };
}

/**
 * Validate PTR (reverse DNS) record.
 */
export function validatePTR(ipAddress: string, ptrRecord: string | null): DNSRecordCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!ptrRecord) {
    issues.push("No PTR record found for IP address");
    recommendations.push("Set up reverse DNS (PTR) for your mail server IP");
    return { type: "PTR", status: "fail", issues, recommendations };
  }

  if (ptrRecord.includes(ipAddress)) {
    issues.push("PTR record should not contain the IP address");
    recommendations.push("PTR should point to a hostname, not an IP");
    return { type: "PTR", status: "warn", value: ptrRecord, issues, recommendations };
  }

  return { type: "PTR", status: "pass", value: ptrRecord, issues, recommendations };
}

/**
 * Validate TLS configuration.
 */
export function validateTLS(hasSTARTTLS: boolean, certValid: boolean): DNSRecordCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!hasSTARTTLS) {
    issues.push("STARTTLS not supported");
    recommendations.push("Enable STARTTLS on your mail server");
    return { type: "TLS", status: "fail", issues, recommendations };
  }

  if (!certValid) {
    issues.push("TLS certificate is invalid or expired");
    recommendations.push("Install a valid TLS certificate (e.g., Let's Encrypt)");
    return { type: "TLS", status: "fail", issues, recommendations };
  }

  return { type: "TLS", status: "pass", issues, recommendations };
}

/**
 * Validate TLS-RPT record.
 */
export function validateTLSRPT(record: string | null): DNSRecordCheck {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!record) {
    issues.push("No TLS-RPT record found");
    recommendations.push("Add TLS-RPT record: v=TLSRPTv1; rua=mailto:tlsrpt@yourdomain.com");
    return { type: "TLS-RPT", status: "warn", issues, recommendations };
  }

  if (!record.startsWith("v=TLSRPTv1")) {
    issues.push("TLS-RPT record must start with 'v=TLSRPTv1'");
    recommendations.push("Fix TLS-RPT record format");
    return { type: "TLS-RPT", status: "warn", value: record, issues, recommendations };
  }

  return { type: "TLS-RPT", status: "pass", value: record, issues, recommendations };
}

/**
 * Calculate overall compliance score.
 */
export function calculateComplianceScore(checks: DNSRecordCheck[]): number {
  let totalScore = 0;
  let maxScore = 0;

  for (const check of checks) {
    const weight = CHECK_WEIGHTS[check.type];
    maxScore += weight;

    if (check.status === "pass") {
      totalScore += weight;
    } else if (check.status === "warn") {
      totalScore += weight * 0.5;
    }
  }

  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

/**
 * Get compliance status from score.
 */
export function getComplianceStatus(score: number): "compliant" | "partial" | "non-compliant" {
  if (score >= 80) return "compliant";
  if (score >= 50) return "partial";
  return "non-compliant";
}

/**
 * Run a full deliverability check.
 */
export function runDeliverabilityCheck(domain: string, records: {
  spf?: string | null;
  dkimSelector?: string;
  dkim?: string | null;
  dmarc?: string | null;
  ptr?: string | null;
  hasSTARTTLS?: boolean;
  certValid?: boolean;
  tlsRpt?: string | null;
}): DeliverabilityCheck {
  const checks: DNSRecordCheck[] = [];

  checks.push(validateSPF(records.spf ?? null));
  checks.push(validateDKIM(records.dkimSelector ?? "default", records.dkim ?? null));
  checks.push(validateDMARC(records.dmarc ?? null));
  checks.push(validatePTR("", records.ptr ?? null));
  checks.push(validateTLS(records.hasSTARTTLS ?? false, records.certValid ?? false));
  checks.push(validateTLSRPT(records.tlsRpt ?? null));

  const overallScore = calculateComplianceScore(checks);
  const status = getComplianceStatus(overallScore);

  const recommendations = checks
    .flatMap((c) => c.recommendations)
    .filter((r, i, arr) => arr.indexOf(r) === i);

  return {
    domain,
    timestamp: new Date().toISOString(),
    overallScore,
    status,
    checks,
    recommendations,
  };
}

/**
 * Get compliance status color for UI.
 */
export function getDeliverabilityStatusColor(status: "compliant" | "partial" | "non-compliant"): string {
  const colors = {
    compliant: "text-green-500",
    partial: "text-yellow-500",
    "non-compliant": "text-red-500",
  };
  return colors[status];
}

/**
 * Get check status color for UI.
 */
export function getCheckStatusColor(status: CheckStatus): string {
  const colors: Record<CheckStatus, string> = {
    pass: "text-green-500",
    fail: "text-red-500",
    warn: "text-yellow-500",
    "not-checked": "text-gray-500",
  };
  return colors[status];
}

/**
 * Get Gmail/Yahoo compliance requirements summary.
 */
export function getComplianceRequirements(): Array<{
  requirement: string;
  description: string;
  mandatory: boolean;
}> {
  return [
    { requirement: "SPF", description: "Valid SPF record", mandatory: true },
    { requirement: "DKIM", description: "Valid DKIM signature", mandatory: true },
    { requirement: "DMARC", description: "DMARC policy (p=quarantine or p=reject)", mandatory: true },
    { requirement: "PTR", description: "Reverse DNS (PTR) record", mandatory: true },
    { requirement: "TLS", description: "STARTTLS with valid certificate", mandatory: true },
    { requirement: "One-click unsubscribe", description: "List-Unsubscribe header", mandatory: true },
    { requirement: "Spam rate < 0.3%", description: "Keep spam complaints low", mandatory: true },
    { requirement: "TLS-RPT", description: "TLS reporting (recommended)", mandatory: false },
  ];
}
