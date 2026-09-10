/**
 * Email-to-event extraction — NLP-based event detection from emails.
 *
 * Extracts event data (title, date/time, location) from email content
 * using pattern matching and heuristics. Creates calendar events linked
 * to source emails.
 */

import type { Email } from "@/types/email";
import type { CalendarEvent, CalendarEventInput, EventType } from "@/types/calendar";

export interface ExtractedEvent {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  eventType: EventType;
  confidence: number;
  sourceEmailId: string;
}

/** Common date patterns in emails. */
const DATE_PATTERNS = [
  // "Monday, September 15, 2026"
  /(\w+day),?\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})/gi,
  // "September 15, 2026"
  /(\w+)\s+(\d{1,2}),?\s+(\d{4})/gi,
  // "15/09/2026" or "09/15/2026"
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
  // "2026-09-15"
  /(\d{4})-(\d{2})-(\d{2})/g,
];

/** Time patterns. */
const TIME_PATTERNS = [
  // "2:30 PM" or "14:30"
  /(\d{1,2}):(\d{2})\s*(am|pm)?/gi,
  // "2 PM" or "14h"
  /(\d{1,2})\s*(am|pm|h)/gi,
];

/** Location patterns. */
const LOCATION_PATTERNS = [
  /(?:at|location|place|venue|address)\s*:?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?=\s*[,\n]|\s+(?:on|at|from|to|for|and|the)|$)/gi,
  /(?:meet(?:ing|up)\s+at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?=\s*[,\n]|\s+(?:on|at|from|to|for|and|the)|$)/gi,
];

/** Event type keywords. */
const EVENT_TYPE_KEYWORDS: Record<EventType, string[]> = {
  meeting: ["meet", "meeting", "call", "sync", "standup", "1:1", "one on one", "catch up"],
  deadline: ["deadline", "due", "submit", "delivery", "milestone", "eod", "end of day"],
  reminder: ["remind", "reminder", "don't forget", "remember to"],
  social: ["lunch", "dinner", "drinks", "happy hour", "team outing", "party"],
  travel: ["flight", "trip", "travel", "hotel", "booking", "reservation"],
  default: [],
};

/** Month name to number mapping. */
const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Parse a date string from email content.
 */
function parseDate(text: string): { date: string; confidence: number } | null {
  // Try ISO format first
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(`${year}-${month}-${day}T12:00:00Z`);
    if (!isNaN(date.getTime())) {
      return { date: date.toISOString(), confidence: 0.9 };
    }
  }

  // Try "Month Day, Year" format
  const monthDayYear = text.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthDayYear) {
    const month = MONTHS[monthDayYear[1].toLowerCase()];
    const day = parseInt(monthDayYear[2]);
    const year = parseInt(monthDayYear[3]);
    if (month && day && year) {
      const date = new Date(year, month - 1, day, 12, 0, 0);
      if (!isNaN(date.getTime())) {
        return { date: date.toISOString(), confidence: 0.85 };
      }
    }
  }

  return null;
}

/**
 * Parse a time string from email content.
 */
function parseTime(text: string): { hours: number; minutes: number } | null {
  const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;

    return { hours, minutes };
  }

  const simpleTime = text.match(/(\d{1,2})\s*(am|pm)/i);
  if (simpleTime) {
    let hours = parseInt(simpleTime[1]);
    const ampm = simpleTime[2].toLowerCase();
    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    return { hours, minutes: 0 };
  }

  return null;
}

/**
 * Extract location from email content.
 */
function extractLocation(text: string): string {
  // Strip HTML tags for location extraction
  const plainText = text.replace(/<[^>]*>/g, "");
  for (const pattern of LOCATION_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(plainText);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

/**
 * Detect event type from email content.
 */
function detectEventType(text: string): { type: EventType; confidence: number } {
  // Strip HTML tags for type detection
  const lower = text.replace(/<[^>]*>/g, "").toLowerCase();

  // Check in priority order (more specific types first)
  const typeOrder: EventType[] = ["deadline", "meeting", "travel", "social", "reminder"];

  for (const type of typeOrder) {
    for (const keyword of EVENT_TYPE_KEYWORDS[type]) {
      if (lower.includes(keyword)) {
        return { type, confidence: 0.7 };
      }
    }
  }

  return { type: "default", confidence: 0.3 };
}

/**
 * Generate a title from email subject or content.
 */
function generateTitle(email: Email): string {
  // Use subject as base title
  let title = email.subject.replace(/^(Re|Fwd|Fw)\s*:\s*/i, "").trim();

  // If subject is generic, try to extract from preview
  if (!title || title === email.preview) {
    const firstSentence = email.preview.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length < 100) {
      title = firstSentence;
    }
  }

  return title || "Event from email";
}

/**
 * Extract event data from an email.
 */
export function extractEventFromEmail(email: Email): ExtractedEvent | null {
  const text = `${email.subject} ${email.preview} ${email.body}`;

  // Parse date
  const dateResult = parseDate(text);
  if (!dateResult) return null;

  // Parse time
  const timeResult = parseTime(text);
  const startDate = new Date(dateResult.date);
  if (timeResult) {
    startDate.setHours(timeResult.hours, timeResult.minutes, 0, 0);
  }

  // End date = start + 1 hour default
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  // Extract location
  const location = extractLocation(text);

  // Detect event type
  const { type, confidence: typeConfidence } = detectEventType(text);

  // Generate title
  const title = generateTitle(email);

  return {
    title,
    description: `From email: ${email.subject}\n\n${email.preview}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    location,
    eventType: type,
    confidence: (dateResult.confidence + typeConfidence) / 2,
    sourceEmailId: email.id,
  };
}

/**
 * Create a CalendarEventInput from extracted event data.
 */
export function extractedEventToInput(extracted: ExtractedEvent): CalendarEventInput {
  return {
    title: extracted.title,
    description: extracted.description,
    start: extracted.startDate,
    end: extracted.endDate,
    eventType: extracted.eventType,
    location: extracted.location || undefined,
  };
}

/**
 * Check if an email likely contains an event.
 */
export function emailContainsEvent(email: Email): boolean {
  const text = `${email.subject} ${email.preview} ${email.body}`;
  return parseDate(text) !== null;
}

/**
 * Create a link from an event back to its source email.
 */
export function createEmailEventLink(emailId: string, eventId: string): {
  emailId: string;
  eventId: string;
  createdAt: string;
} {
  return {
    emailId,
    eventId,
    createdAt: new Date().toISOString(),
  };
}
