/**
 * Calendar domain types for the integrated calendar (Issue #153).
 *
 * A `CalendarEvent` represents a scheduled event created manually or
 * detected from email content by the AI extraction layer.
 */

/** Type of event — drives color coding and filtering. */
export type EventType =
  "meeting" | "deadline" | "reminder" | "social" | "travel" | "default";

/** Calendar view modes. */
export type CalendarView = "day" | "week" | "month";

/** A single calendar event record. */
export interface CalendarEvent {
  /** Stable unique id (UUID from backend). */
  id: string;
  /** Owner user id (email). */
  userId: string;
  /** Event title / summary. */
  title: string;
  /** Optional longer description. */
  description: string;
  /** Start datetime (ISO 8601). */
  start: string;
  /** End datetime (ISO 8601). */
  end: string;
  /** Event type for color coding. */
  eventType: EventType;
  /** Hex color for display. */
  color: string;
  /** Optional location. */
  location: string;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
}

/** Payload for creating a new event. */
export interface CalendarEventInput {
  title: string;
  description?: string;
  start: string;
  end: string;
  eventType?: EventType;
  color?: string;
  location?: string;
}

/** Payload for updating an event (all fields optional). */
export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  eventType?: EventType;
  color?: string;
  location?: string;
}

/** Query params for listing events in a date range. */
export interface CalendarQuery {
  start?: string;
  end?: string;
}

/** API response wrapper for list endpoint. */
export interface CalendarListResponse {
  events: CalendarEvent[];
  total: number;
}

/** Default color per event type. */
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: "#3788d8",
  deadline: "#e74c3c",
  reminder: "#f39c12",
  social: "#2ecc71",
  travel: "#9b59b6",
  default: "#3788d8",
};
