/**
 * Follow-up detector — rule-based engine for identifying emails that need
 * a reply, detecting promises the user made, estimating expected reply
 * delays, and generating overdue reminders. (Issue #151)
 *
 * Detection is entirely regex/rule-based so it works offline without an
 * AI API key. The AI client can refine results later when available.
 */
import type {
  FollowUpEmailInput,
  FollowUpItem,
  FollowUpReminder,
  ReminderRule,
} from "@/types/follow-up";

/* ------------------------------------------------------------------ *
 * Default detection rules
 * ------------------------------------------------------------------ */

export const DEFAULT_RULES: ReminderRule[] = [
  {
    id: "rule-direct-question",
    name: "Direct question",
    type: "needs_reply",
    pattern: "\\?$|\\?\\s",
    enabled: true,
    defaultDelayHours: 24,
    weight: 70,
  },
  {
    id: "rule-explicit-request",
    name: "Explicit request",
    type: "needs_reply",
    pattern:
      "\\b(please\\s+(send|review|confirm|approve|reply|let me know|provide|share|check|sign))\\b",
    enabled: true,
    defaultDelayHours: 24,
    weight: 65,
  },
  {
    id: "rule-need-input",
    name: "Needs input",
    type: "needs_reply",
    pattern:
      "\\b(can you|could you|would you|need you|are you able|is it possible)\\b",
    enabled: true,
    defaultDelayHours: 48,
    weight: 60,
  },
  {
    id: "rule-urgent-flag",
    name: "Urgent flag",
    type: "needs_reply",
    pattern: "\\b(urgent|asap|time-?sensitive|deadline|end of day|eod)\\b",
    enabled: true,
    defaultDelayHours: 4,
    weight: 90,
  },
  {
    id: "rule-promise-send",
    name: "Promise to send",
    type: "promise",
    pattern:
      "\\b(I('ll| will| will send|'ll send|'ll share)\\s+.+\\s+(by|on|before)\\s+",
    enabled: true,
    defaultDelayHours: 0,
    weight: 75,
  },
  {
    id: "rule-promise-get-back",
    name: "Promise to get back",
    type: "promise",
    pattern:
      "\\b(I('ll| will)\\s+(get back to you|follow up|circle back|reach out)\\b",
    enabled: true,
    defaultDelayHours: 48,
    weight: 65,
  },
];

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Strip HTML tags so regex runs against plain text. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Combined searchable text (subject + stripped body). */
function searchText(email: FollowUpEmailInput): string {
  const body = stripHtml(email.body ?? "");
  return `${email.subject ?? ""} ${body}`.toLowerCase();
}

/* ------------------------------------------------------------------ *
 * Date / promise parsing
 * ------------------------------------------------------------------ */

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Try to extract a date from a promise phrase like "by Friday" or
 * "before next Monday" or "on the 15th". Returns an ISO string or null.
 */
function parsePromiseDate(
  text: string,
  emailDate: string,
): string | null {
  const base = new Date(emailDate);
  const lower = text.toLowerCase();

  // "by Friday" / "before Monday" / "on Tuesday"
  const dayMatch = lower.match(
    /\b(?:by|before|on|until|no later than)\s+(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
  );
  if (dayMatch) {
    const targetDay = WEEKDAYS.indexOf(dayMatch[1]);
    if (targetDay >= 0) {
      const result = new Date(base);
      const currentDay = result.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // next occurrence
      result.setDate(result.getDate() + diff);
      result.setHours(17, 0, 0, 0); // end of business day
      return result.toISOString();
    }
  }

  // "by the 15th" / "on the 3rd"
  const dateMatch = lower.match(/\b(?:by|before|on|until)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const result = new Date(base);
      result.setDate(day);
      result.setHours(17, 0, 0, 0);
      // If the day already passed this month, push to next month.
      if (result.getTime() < base.getTime()) {
        result.setMonth(result.getMonth() + 1);
      }
      return result.toISOString();
    }
  }

  // "today" / "tomorrow" / "this week" / "end of week" / "next week"
  if (/\b(today|eod|end of (the )?day)\b/.test(lower)) {
    const result = new Date(base);
    result.setHours(17, 0, 0, 0);
    return result.toISOString();
  }
  if (/\btomorrow\b/.test(lower)) {
    const result = new Date(base);
    result.setDate(result.getDate() + 1);
    result.setHours(12, 0, 0, 0);
    return result.toISOString();
  }
  if (/\b(this week|end of (the )?week|eow)\b/.test(lower)) {
    const result = new Date(base);
    const day = result.getDay();
    let diff = 5 - day; // Friday
    if (diff <= 0) diff = 0; // already Friday/weekend → today
    result.setDate(result.getDate() + diff);
    result.setHours(17, 0, 0, 0);
    return result.toISOString();
  }
  if (/\bnext week\b/.test(lower)) {
    const result = new Date(base);
    result.setDate(result.getDate() + 7);
    result.setHours(9, 0, 0, 0);
    return result.toISOString();
  }

  // "in 2 days" / "in 3 weeks"
  const relMatch = lower.match(/\bin\s+(\d+)\s+(day|week|month)s?\b/);
  if (relMatch) {
    const n = parseInt(relMatch[1], 10);
    const unit = relMatch[2];
    const result = new Date(base);
    if (unit === "day") result.setDate(result.getDate() + n);
    else if (unit === "week") result.setDate(result.getDate() + n * 7);
    else if (unit === "month") result.setMonth(result.getMonth() + n);
    result.setHours(12, 0, 0, 0);
    return result.toISOString();
  }

  return null;
}

/* ------------------------------------------------------------------ *
 * Sender pattern analysis
 * ------------------------------------------------------------------ */

/**
 * Estimate the expected reply delay (in hours) for a sender based on
 * historical response patterns. Falls back to the rule's default.
 *
 * @param senderAddress - The sender's email address.
 * @param history - Previous emails from this sender (for pattern analysis).
 * @returns Estimated delay in hours.
 */
export function estimateReplyDelay(
  senderAddress: string,
  history: FollowUpEmailInput[] = [],
): number {
  const fromSender = history.filter(
    (e) => e.from.address.toLowerCase() === senderAddress.toLowerCase(),
  );

  if (fromSender.length < 2) return 24; // default 1 day

  // Heuristic: if the sender tends to send outside business hours,
  // they may expect faster replies (async workers). If they send
  // frequently, a shorter window is reasonable.
  const avgGapMs =
    fromSender.reduce((sum, e, i) => {
      if (i === 0) return sum;
      const prev = new Date(fromSender[i - 1].date).getTime();
      const curr = new Date(e.date).getTime();
      return sum + Math.abs(curr - prev);
    }, 0) / Math.max(fromSender.length - 1, 1);

  const avgGapHours = avgGapMs / (1000 * 60 * 60);

  if (avgGapHours < 12) return 12; // frequent communicators → half-day
  if (avgGapHours < 48) return 24; // daily cadence → 1 day
  return 48; // infrequent → 2 days
}

/* ------------------------------------------------------------------ *
 * Core detection
 * ------------------------------------------------------------------ */

let idCounter = 0;
function genId(): string {
  idCounter += 1;
  return `fu-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Detect follow-up items from a list of emails.
 *
 * - Finds emails needing a reply (questions, explicit requests).
 * - Detects promises the user made ("I'll send by Friday").
 * - Computes due dates from rule delays or parsed promise dates.
 * - Skips emails in the "sent" folder for needs_reply (those are the
 *   user's own outgoing messages).
 * - Skips emails already replied to (heuristic: a later email in the
 *   same thread from the user's own domain).
 */
export function detectFollowUps(
  emails: FollowUpEmailInput[],
  rules: ReminderRule[] = DEFAULT_RULES,
): FollowUpItem[] {
  const now = new Date().toISOString();
  const enabledRules = rules.filter((r) => r.enabled);
  const items: FollowUpItem[] = [];

  // Build a quick lookup of thread → sender addresses for reply detection.
  const threadSenders = new Map<string, Set<string>>();
  for (const e of emails) {
    const tid = e.threadId ?? e.id;
    if (!threadSenders.has(tid)) threadSenders.set(tid, new Set());
    threadSenders.get(tid)!.add(e.from.address.toLowerCase());
  }

  for (const email of emails) {
    const text = searchText(email);
    if (!text) continue;

    // For "needs_reply" we only care about incoming emails (inbox).
    const isIncoming = email.folder === "inbox";

    // Check if the thread already has a reply from a different sender
    // (simple heuristic: more than one unique sender in the thread).
    const tid = email.threadId ?? email.id;
    const senders = threadSenders.get(tid);
    const hasReply = senders ? senders.size > 1 : false;

    for (const rule of enabledRules) {
      let regex: RegExp;
      try {
        regex = new RegExp(rule.pattern, "gi");
      } catch {
        continue; // skip invalid patterns
      }

      if (!regex.test(text)) continue;

      // Skip needs_reply if it's our own sent email or already replied.
      if (rule.type === "needs_reply" && (!isIncoming || hasReply)) continue;

      // For promises, we only look at outgoing (sent) emails.
      if (rule.type === "promise" && email.folder !== "sent") continue;

      // Compute due date.
      let dueDate: string;
      if (rule.type === "promise") {
        const parsed = parsePromiseDate(text, email.date);
        dueDate = parsed ?? new Date(
          new Date(email.date).getTime() + rule.defaultDelayHours * 3600_000,
        ).toISOString();
      } else {
        const delay = estimateReplyDelay(email.from.address, emails);
        dueDate = new Date(
          new Date(email.date).getTime() + delay * 3600_000,
        ).toISOString();
      }

      // Build reasoning.
      const reasoning =
        rule.type === "promise"
          ? `You made a promise: "${rule.name}". Due ${new Date(dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}.`
          : `${email.from.name} sent you a ${rule.name.toLowerCase()}. Reply expected by ${new Date(dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}.`;

      items.push({
        id: genId(),
        emailId: email.id,
        threadId: email.threadId,
        type: rule.type,
        status: "pending",
        senderName: email.from.name,
        senderAddress: email.from.address,
        subject: email.subject,
        emailDate: email.date,
        dueDate,
        detectedAt: now,
        updatedAt: now,
        confidence: 0.7,
        source: "rules",
        reasoning,
      });
    }
  }

  // Deduplicate: if the same email matched multiple rules of the same type,
  // keep the highest-weight one (already first by rule order, so just keep
  // the first per email+type).
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.emailId}:${item.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------ *
 * Reminder generation
 * ------------------------------------------------------------------ */

/**
 * Generate reminders from follow-up items that are overdue or approaching
 * their due date.
 *
 * @param followUps - All tracked follow-up items.
 * @param now - Reference timestamp (defaults to current time).
 * @returns Array of reminders to surface.
 */
export function generateReminders(
  followUps: FollowUpItem[],
  now: Date = new Date(),
): FollowUpReminder[] {
  const nowMs = now.getTime();
  const reminders: FollowUpReminder[] = [];

  for (const fu of followUps) {
    if (fu.status === "dismissed" || fu.status === "completed") continue;
    if (fu.status === "snoozed") {
      const snoozedMs = fu.snoozedUntil ? new Date(fu.snoozedUntil).getTime() : 0;
      if (snoozedMs > nowMs) continue; // still snoozed
    }

    const dueMs = new Date(fu.dueDate).getTime();
    const emailMs = new Date(fu.emailDate).getTime();
    const daysWaiting = Math.max(
      0,
      Math.floor((nowMs - emailMs) / (1000 * 60 * 60 * 24)),
    );
    const daysOverdue = Math.floor((nowMs - dueMs) / (1000 * 60 * 60 * 24));

    // Only remind if overdue or within 24h of due date.
    if (nowMs < dueMs - 24 * 3600_000) continue;

    let message: string;
    if (fu.type === "needs_reply") {
      if (daysOverdue > 0) {
        message = `You haven't replied to ${fu.senderName} in ${daysWaiting} day${daysWaiting === 1 ? "" : "s"}`;
      } else {
        message = `Reply to ${fu.senderName} today — "${fu.subject}"`;
      }
    } else if (fu.type === "promise") {
      if (daysOverdue >= 0) {
        message = `You promised to send "${fu.subject}" — it's overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`;
      } else {
        message = `You promised to send "${fu.subject}" today`;
      }
    } else {
      // sent_awaiting
      message = `Still waiting for ${fu.senderName} to reply to "${fu.subject}" (${daysWaiting} day${daysWaiting === 1 ? "" : "s"})`;
    }

    const urgency: FollowUpReminder["urgency"] =
      daysOverdue >= 3 ? "urgent" : daysOverdue >= 1 ? "warning" : "info";

    reminders.push({
      id: genId(),
      followUpId: fu.id,
      emailId: fu.emailId,
      message,
      urgency,
      senderName: fu.senderName,
      subject: fu.subject,
      daysWaiting,
      createdAt: now.toISOString(),
    });
  }

  return reminders;
}

/**
 * Compute an urgency band for a follow-up item based on days overdue.
 */
export function getUrgency(fu: FollowUpItem, now: Date = new Date()): "info" | "warning" | "urgent" {
  const daysOverdue = Math.floor(
    (now.getTime() - new Date(fu.dueDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysOverdue >= 3) return "urgent";
  if (daysOverdue >= 1) return "warning";
  return "info";
}
