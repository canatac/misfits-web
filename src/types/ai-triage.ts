/**
 * AI triage & summary domain types for misfits.ai Mail (Issue #148).
 *
 * These types power the AI-driven email triage pipeline: categorising
 * incoming mail, scoring priority, generating concise summaries, and
 * suggesting follow-up actions.
 */
import type { Email } from "@/types/email";

/**
 * High-level classification assigned to an email by the triage engine.
 * The order roughly reflects "needs attention" descending.
 */
export type EmailCategory =
  | "important"
  | "newsletter"
  | "notification"
  | "promo"
  | "social"
  | "personal"
  | "work";

/**
 * Priority is expressed as an integer 0–100, where 0 is lowest and
 * 100 is maximum urgency. The `PriorityBand` gives a coarse label
 * that the UI can colour without re-deriving thresholds.
 */
export type PriorityScore = number;

export type PriorityBand = "low" | "medium" | "high" | "urgent";

/**
 * A suggested next action for the user, derived from the triage result.
 */
export type TriageAction = "reply" | "archive" | "follow_up" | "delegate" | "delete";

/**
 * Full triage result for a single email. Produced by `triageEmail`
 * (AI-backed when available, rule-based fallback otherwise).
 */
export interface TriageResult {
  emailId: string;
  category: EmailCategory;
  priority: PriorityScore;
  band: PriorityBand;
  action: TriageAction;
  needsUrgentReply: boolean;
  /** Human-readable explanation of why this priority/category was chosen. */
  reasoning: string;
  /** Short list of relevant keywords extracted from the email. */
  keywords: string[];
  /** Confidence in the AI prediction, 0–1. Rule-based = 0.5. */
  confidence: number;
  /** ISO timestamp of when the triage was generated. */
  triagedAt: string;
  /** Whether this result came from AI or the rule-based fallback. */
  source: "ai" | "rules";
}

/**
 * A concise AI-generated summary of an email's contents.
 */
export interface EmailSummary {
  emailId: string;
  /** 1–2 sentence summary of the email body. */
  summary: string;
  /** Key points extracted from the email. */
  keyPoints: string[];
  /** Suggested reply angle / talking points (if a reply is warranted). */
  replyHint?: string;
  /** Estimated reading time in seconds. */
  estimatedReadTime: number;
  /** ISO timestamp of when the summary was generated. */
  generatedAt: string;
  source: "ai" | "rules";
}

/**
 * A follow-up suggestion — when the user should follow up and how.
 */
export interface FollowUpSuggestion {
  emailId: string;
  /** Suggested action. */
  action: TriageAction;
  /** Human-readable rationale for the suggestion. */
  reason: string;
  /** Suggested follow-up date (ISO), e.g. "reply within 24h". */
  suggestedDate?: string;
  /** A draft prompt the user could paste into a reply. */
  draftPrompt?: string;
}

/**
 * Aggregated triage statistics for a set of results, used by the
 * triage panel to render counts and urgent-item lists.
 */
export interface TriageStats {
  total: number;
  byCategory: Record<EmailCategory, number>;
  byBand: Record<PriorityBand, number>;
  urgentCount: number;
  needsReplyCount: number;
  averagePriority: number;
}

/**
 * Input shape accepted by the triage service — a subset is fine, but
 * `id`, `from`, `subject`, `preview`, and `body` are required.
 */
export type TriageEmailInput = Pick<
  Email,
  "id" | "from" | "subject" | "preview" | "body" | "date" | "isRead" | "isStarred" | "isImportant"
>;

/**
 * Map a numeric priority score to a coarse band.
 */
export function priorityBand(score: PriorityScore): PriorityBand {
  if (score >= 80) return "urgent";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}
