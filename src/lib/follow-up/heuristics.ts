/**
 * Follow-up detector — pure text/date helpers.
 * Extraits de follow-up-detector.ts pour réduire la taille du fichier principal.
 */
import type { FollowUpEmailInput } from "@/types/follow-up";

/** Strip HTML tags so regex runs against plain text. */
export function stripHtml(html: string): string {
  // Iteratively remove <style> and <script> blocks to prevent
  // incomplete multi-character sanitization (e.g. nested/malformed tags).
  let result = html;
  let prev: string;
  do {
    prev = result;
    result = result.replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/gi, " ");
  } while (result !== prev);
  do {
    prev = result;
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi, " ");
  } while (result !== prev);
  return result
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Combined searchable text (subject + stripped body). */
export function searchText(email: FollowUpEmailInput): string {
  const body = stripHtml(email.body ?? "");
  return `${email.subject ?? ""} ${body}`.toLowerCase();
}

export const WEEKDAYS = [
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
export function parsePromiseDate(
  text: string,
  emailDate: string,
): string | null {
  const base = new Date(emailDate);
  const lower = text.toLowerCase();

  const dayMatch = lower.match(
    /\b(?:by|before|on|until|no later than)\s+(?:next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
  );
  if (dayMatch) {
    const targetDay = WEEKDAYS.indexOf(dayMatch[1]);
    if (targetDay >= 0) {
      const result = new Date(base);
      const currentDay = result.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      result.setDate(result.getDate() + diff);
      result.setHours(17, 0, 0, 0);
      return result.toISOString();
    }
  }

  const dateMatch = lower.match(
    /\b(?:by|before|on|until)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const result = new Date(base);
      result.setDate(day);
      result.setHours(17, 0, 0, 0);
      if (result.getTime() < base.getTime()) {
        result.setMonth(result.getMonth() + 1);
      }
      return result.toISOString();
    }
  }

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
    let diff = 5 - day;
    if (diff <= 0) diff = 0;
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

let idCounter = 0;
export function genId(): string {
  idCounter += 1;
  return `fu-${Date.now().toString(36)}-${idCounter}`;
}
