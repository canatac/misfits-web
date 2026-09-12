/**
 * Email-to-Event (Issue #471).
 *
 * Calendar integration — extract structured event data from email content.
 * Parses meeting invites, deadlines, and date/time mentions from email
 * subjects and bodies to auto-populate calendar events via the AI layer.
 */

import type { Email } from "@/types/email";
import type { CalendarEventInput, EventType } from "@/types/calendar";

/** Regex for ISO datetime detection in email text. */
const ISO_DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?\b/g;

/** Regex for common date patterns (e.g., "Jan 15, 2026" or "15 January"). */
const HUMAN_DATE_RE = /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?\s*(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,]?\s*(\d{4})?\b/i;

/** Patterns indicating a meeting or event. */
const MEETING_PATTERNS = [
  /meeting/i,
  /call with/i,
  /sync(?:hronization)?/i,
  /standup/i,
  /catch[- ]?up/i,
  /discuss(?:ion)? (?:about|on|re:?)/i,
  /let(?:\'s| us) (?:meet|talk|chat|connect)/i,
  /schedule (?:a |(?:an? ))?(?:call|meeting|chat)/i,
  /zoom|teams|meet\.google|webex/i,
];

/** Patterns indicating a deadline. */
const DEADLINE_PATTERNS = [
  /deadline/i,
  /due (?:date|by)/i,
  /eod/i,
  /cob/i,
  /by (?:end of )?(?:day|week|month)/i,
  /no later than/i,
  /asap/i,
];

/** Patterns indicating travel. */
const TRAVEL_PATTERNS = [
  /flight|booking|reservation|hotel|trip|travel/i,
];

/**
 * Detect the event type from email content.
 *
 * @param subject Email subject line.
 * @param body Email body text.
 * @returns Most relevant event type.
 */
export function detectEventType(subject: string, body: string): EventType {
  const text = `${subject} ${body}`;

  if (DEADLINE_PATTERNS.some((p) => p.test(text))) return "deadline";
  if (TRAVEL_PATTERNS.some((p) => p.test(text))) return "travel";
  if (MEETING_PATTERNS.some((p) => p.test(text))) return "meeting";
  return "default";
}

/**
 * Extract ISO datetime strings from email text.
 *
 * @param text Email subject or body.
 * @returns Array of matched ISO datetime strings.
 */
export function extractISODates(text: string): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  ISO_DATE_RE.lastIndex = 0;
  while ((m = ISO_DATE_RE.exec(text)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

/**
 * Parse human-readable dates into ISO date strings.
 *
 * @param text Email subject or body.
 * @returns Array of ISO date strings (YYYY-MM-DD).
 */
export function extractHumanDates(text: string): string[] {
  const months: Record<string, string> = {
    january: "01", jan: "01", february: "02", feb: "02",
    march: "03", mar: "03", april: "04", apr: "04",
    may: "05", june: "06", jun: "06", july: "07", jul: "07",
    august: "08", aug: "08", september: "09", sep: "09",
    october: "10", oct: "10", november: "11", nov: "11",
    december: "12", dec: "12",
  };

  const matches: string[] = [];
  let m: RegExpExecArray | null;
  HUMAN_DATE_RE.lastIndex = 0;
  while ((m = HUMAN_DATE_RE.exec(text)) !== null) {
    const day = m[1].padStart(2, "0");
    const month = months[m[2].toLowerCase()];
    const year = m[3] || new Date().getFullYear().toString();
    if (month) {
      matches.push(`${year}-${month}-${day}`);
    }
  }
  return matches;
}

/**
 * Determine the best title for a calendar event from an email.
 *
 * Strips Re:/Fwd: prefixes and extracts the core topic.
 *
 * @param email Email to extract title from.
 * @returns Event title.
 */
export function extractEventTitle(email: Email): string {
  const subject = email.subject
    /(?:^(?:re|fwd|fw|tr|aw|wg):\s*)+/i
    .trim();

  if (subject) return subject;
  return "Untitled Event";
}

/**
 * Build a CalendarEventInput from an email.
 *
 * Combines all extraction heuristics into a single structured payload
 * suitable for calendar event creation.
 *
 * @param email Source email.
 * @returns Calendar event input, or null if no date can be extracted.
 */
export function buildEventFromEmail(email: Email): CalendarEventInput | null {
  const text = `${email.subject} ${email.body}`;

  // Try ISO dates first
  const isoDates = extractISODates(text);
  if (isoDates.length >= 2) {
    return {
      title: extractEventTitle(email),
      description: email.preview || email.body.slice(0, 200),
      start: isoDates[0],
      end: isoDates[1],
      eventType: detectEventType(email.subject, email.body),
    };
  }

  if (isoDates.length === 1) {
    return {
      title: extractEventTitle(email),
      description: email.preview || email.body.slice(0, 200),
      start: isoDates[0],
      end: isoDates[0],
      eventType: detectEventType(email.subject, email.body),
    };
  }

  // Fall back to human-readable dates
  const humanDates = extractHumanDates(text);
  if (humanDates.length >= 1) {
    return {
      title: extractEventTitle(email),
      description: email.preview || email.body.slice(0, 200),
      start: humanDates[0],
      end: humanDates[1] || humanDates[0],
      eventType: detectEventType(email.subject, email.body),
    };
  }

  return null;
}
