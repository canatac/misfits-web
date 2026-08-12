/**
 * Security & phishing-detection domain types for misfits.ai Mail.
 *
 * The phishing detector (`@/lib/phishing-detector`) produces a `PhishingResult`
 * for a given email. The result is consumed by the security banner, the
 * per-list-item indicator, the link analyzer popover, and the aggregate
 * security dashboard.
 */

/** Overall threat classification for a scanned email or link. */
export type ThreatLevel = "safe" | "suspicious" | "dangerous" | "critical";

/** Pass / fail / not-present status for an authentication header (SPF/DKIM/DMARC). */
export type AuthStatus = "pass" | "fail" | "none" | "unknown";

/** Category of a detected security indicator. */
export type IndicatorType =
  | "header"
  | "link"
  | "domain"
  | "content"
  | "attachment"
  | "sender"
  | "bec"
  | "ai";

/** Severity of an individual indicator. */
export type IndicatorSeverity = "info" | "low" | "medium" | "high" | "critical";

/**
 * A single security finding produced by the detector.
 */
export interface SecurityIndicator {
  /** Category of the finding. */
  type: IndicatorType;
  /** How serious this individual finding is. */
  severity: IndicatorSeverity;
  /** Short human-readable label, e.g. "Mismatched URL". */
  description: string;
  /** Optional longer explanation / evidence. */
  detail?: string;
}

/**
 * SPF / DKIM / DMARC authentication results parsed from the email headers.
 */
export interface HeaderAnalysis {
  spf: AuthStatus;
  dkim: AuthStatus;
  dmarc: AuthStatus;
  /** Human-readable notes for each check (e.g. the raw header value). */
  details: string[];
}

/**
 * A link extracted from the email body with its own risk assessment.
 */
export interface SuspiciousLink {
  /** The real destination URL as found in the `href`. */
  url: string;
  /** The visible display text of the link (if any). */
  displayText?: string;
  /** Why this link was flagged (empty when the link looks clean). */
  reason: string;
  /** Per-link risk score, 0–100 (higher = more dangerous). */
  riskScore: number;
}

/**
 * The full result of scanning a single email for phishing / security threats.
 */
export interface PhishingResult {
  /** The email this result applies to. */
  emailId: string;
  /** Overall threat classification. */
  threatLevel: ThreatLevel;
  /** Overall risk score, 0–100 (higher = more dangerous). */
  score: number;
  /** Human-readable summary reasons for the classification. */
  reasons: string[];
  /** Detailed findings, each with its own type and severity. */
  indicators: SecurityIndicator[];
  /** Links analysed from the body, with per-link risk scores. */
  suspiciousLinks: SuspiciousLink[];
  /** SPF / DKIM / DMARC header authentication analysis. */
  headers: HeaderAnalysis;
  /** ISO timestamp of when the scan ran. */
  scannedAt: string;
  /** Whether an AI (OpenRouter) analysis contributed to this result. */
  aiAssisted: boolean;
}

/** Aggregate statistics derived from a collection of `PhishingResult`s. */
export interface SecurityStats {
  total: number;
  byLevel: Record<ThreatLevel, number>;
  /** Average risk score across all scanned emails. */
  averageScore: number;
  /** Number of emails flagged as suspicious or worse. */
  threatsBlocked: number;
  /** Counts of SPF / DKIM / DMARC pass results. */
  authRates: {
    spf: number;
    dkim: number;
    dmarc: number;
  };
}

/** Recommended action shown to the user for a given threat level. */
export type SecurityAction =
  | "none"
  | "verify-sender"
  | "do-not-click"
  | "report-phishing"
  | "block-sender";

/* ------------------------------------------------------------------ */
/* Security monitoring API domain types                               */
/* ------------------------------------------------------------------ */

export type SecuritySeverity = "info" | "low" | "medium" | "high" | "critical";
export type SecurityMode = "observe" | "enforce";
export type SecurityActionType =
  "alert" | "throttle" | "quarantine" | "block" | "human_challenge";
export type SecurityAlertStatus =
  "active" | "acknowledged" | "resolved" | "rolled_back";

export interface SecurityAlert {
  id: string;
  ts: string;
  rule_id: string;
  rule_name: string;
  rule_version: string;
  severity: SecuritySeverity;
  confidence: number;
  tenant_id?: string | null;
  user_id?: string | null;
  ip?: string | null;
  country?: string | null;
  asn?: string | null;
  signal?: Record<string, unknown>;
  mode: SecurityMode;
  action: SecurityActionType;
  action_duration_s?: number | null;
  remediation_level: 1 | 2 | 3 | 4;
  rolled_back: boolean;
  audit_hash: string;
  context?: Record<string, unknown>;
  status: SecurityAlertStatus;
}

export interface SecurityAlertsResponse {
  window?: string;
  alert_count?: number;
  alerts: SecurityAlert[];
}

export interface SecurityIncidentsResponse {
  page: number;
  page_size: number;
  count: number;
  alerts: SecurityAlert[];
}

export interface TenantRemediationState {
  tenant_id: string;
  level: 1 | 2 | 3 | 4;
  action: SecurityActionType;
  reason: string;
  alert_id: string;
  applied_at: string;
  expires_at?: string | null;
  rolled_back: boolean;
}

export interface TenantStatusResponse {
  tenant_id: string;
  state: TenantRemediationState | null;
}

export interface RollbackResponse {
  rolled_back: boolean;
  alert_id: string;
}
