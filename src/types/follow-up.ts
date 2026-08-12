/**
 * Follow-up tracking & reminders domain types for misfits.ai Mail (Issue #151).
 *
 * These types power the follow-up engine: detecting emails that need a reply,
 * tracking promises the user made ("I'll send the report by Friday"), estimating
 * expected reply delays, and surfacing overdue reminders.
 */
import type { Email } from "@/types/email";

/**
 * The kind of follow-up being tracked.
 */
export type FollowUpType = "needs_reply" | "sent_awaiting" | "promise";

/**
 * Lifecycle status of a tracked follow-up item.
 */
export type FollowUpStatus =
  | "pending" // detected, not yet acted on
  | "snoozed" // user postponed the reminder
  | "dismissed" // user dismissed it
  | "completed" // reply sent / promise fulfilled
  | "overdue"; // due date passed without action

/**
 * A single tracked follow-up item.
 */
export interface FollowUpItem {
  /** Unique id for this follow-up record. */
  id: string;
  /** The email this follow-up refers to. */
  emailId: string;
  /** Thread id (mirrored from the email for grouping). */
  threadId?: string;
  /** Kind of follow-up. */
  type: FollowUpType;
  /** Current lifecycle status. */
  status: FollowUpStatus;
  /** Sender display name (cached for quick rendering). */
  senderName: string;
  /** Sender email address (cached). */
  senderAddress: string;
  /** Subject line (cached). */
  subject: string;
  /** ISO date the email was received / sent. */
  emailDate: string;
  /** ISO date by which a reply/action is expected. */
  dueDate: string;
  /** Optional human-readable reminder message. */
  reminder?: string;
  /** ISO timestamp the follow-up was first detected. */
  detectedAt: string;
  /** ISO timestamp the follow-up was last updated. */
  updatedAt: string;
  /** When snoozed, the snooze-until ISO timestamp. */
  snoozedUntil?: string;
  /** Confidence of the detection (0–1). Rule-based = 0.7. */
  confidence: number;
  /** Whether this was produced by AI or rules. */
  source: "ai" | "rules";
  /** Why the detector flagged this email. */
  reasoning: string;
}

/**
 * A reminder surfaced to the user (derived from overdue follow-up items).
 */
export interface FollowUpReminder {
  /** Unique id (mirrors the follow-up item id). */
  id: string;
  /** The follow-up item this reminder refers to. */
  followUpId: string;
  /** Email id. */
  emailId: string;
  /** Human-readable reminder text. */
  message: string;
  /** Urgency level for badge colouring. */
  urgency: "info" | "warning" | "urgent";
  /** Sender display name for quick reference. */
  senderName: string;
  /** Subject line. */
  subject: string;
  /** Days overdue / waiting (for display). */
  daysWaiting: number;
  /** ISO timestamp the reminder was generated. */
  createdAt: string;
}

/**
 * A detection rule used by the follow-up detector.
 */
export interface ReminderRule {
  /** Unique rule id. */
  id: string;
  /** Display label. */
  name: string;
  /** Which follow-up type this rule produces. */
  type: FollowUpType;
  /** Regex pattern (source string) to match against email body/subject. */
  pattern: string;
  /** Whether the rule is currently enabled. */
  enabled: boolean;
  /** Default delay (in hours) added to the email date to compute the due date. */
  defaultDelayHours: number;
  /** Priority weight — higher = more urgent. */
  weight: number;
}

/**
 * A minimal email shape the detector needs (subset of Email).
 */
export type FollowUpEmailInput = Pick<
  Email,
  | "id"
  | "from"
  | "subject"
  | "preview"
  | "body"
  | "date"
  | "folder"
  | "threadId"
>;
