/**
 * Email scheduling calendar view (Issue #475).
 *
 * Provides utilities for displaying scheduled emails in a calendar view,
 * with drag-and-drop rescheduling and account color-coding.
 */

export interface ScheduledEmailEvent {
  id: string;
  emailId: string;
  subject: string;
  to: string;
  scheduledAt: string;
  accountId: string;
  accountColor: string;
  status: "pending" | "sent" | "failed";
}

export interface CalendarDay {
  date: string;
  events: ScheduledEmailEvent[];
}

export interface CalendarView {
  view: "month" | "week" | "day";
  currentDate: string;
  days: CalendarDay[];
}

/**
 * Create a calendar view for scheduled emails.
 */
export function createCalendarView(
  events: ScheduledEmailEvent[],
  view: "month" | "week" | "day" = "month",
  currentDate: string = new Date().toISOString()
): CalendarView {
  return {
    view,
    currentDate,
    days: groupEventsByDay(events, view, currentDate),
  };
}

/**
 * Group events by day.
 */
function groupEventsByDay(
  events: ScheduledEmailEvent[],
  view: "month" | "week" | "day",
  currentDate: string
): CalendarDay[] {
  const days: CalendarDay[] = [];
  const date = new Date(currentDate);

  if (view === "month") {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
      const dayEvents = events.filter((e) => e.scheduledAt.slice(0, 10) === dateStr);
      days.push({ date: dateStr, events: dayEvents });
    }
  } else if (view === "week") {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().slice(0, 10);
      const dayEvents = events.filter((e) => e.scheduledAt.slice(0, 10) === dateStr);
      days.push({ date: dateStr, events: dayEvents });
    }
  } else {
    const dateStr = date.toISOString().slice(0, 10);
    const dayEvents = events.filter((e) => e.scheduledAt.slice(0, 10) === dateStr);
    days.push({ date: dateStr, events: dayEvents });
  }

  return days;
}

/**
 * Reschedule an email to a new date/time.
 */
export function rescheduleEmail(
  events: ScheduledEmailEvent[],
  emailId: string,
  newScheduledAt: string
): ScheduledEmailEvent[] {
  return events.map((e) =>
    e.id === emailId ? { ...e, scheduledAt: newScheduledAt } : e
  );
}

/**
 * Get events for a specific date.
 */
export function getEventsForDate(
  events: ScheduledEmailEvent[],
  date: string
): ScheduledEmailEvent[] {
  return events.filter((e) => e.scheduledAt.slice(0, 10) === date);
}

/**
 * Get events for a specific account.
 */
export function getEventsByAccount(
  events: ScheduledEmailEvent[],
  accountId: string
): ScheduledEmailEvent[] {
  return events.filter((e) => e.accountId === accountId);
}

/**
 * Count events per day.
 */
export function getEventCountForDate(
  events: ScheduledEmailEvent[],
  date: string
): number {
  return events.filter((e) => e.scheduledAt.slice(0, 10) === date).length;
}

/**
 * Check if a date has events.
 */
export function hasEventsOnDate(events: ScheduledEmailEvent[], date: string): boolean {
  return events.some((e) => e.scheduledAt.slice(0, 10) === date);
}

/**
 * Get account color for an event.
 */
export function getEventColor(event: ScheduledEmailEvent): string {
  return event.accountColor;
}

/**
 * Sort events by scheduled time.
 */
export function sortEventsByTime(events: ScheduledEmailEvent[]): ScheduledEmailEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

/**
 * Format scheduled time for display.
 */
export function formatScheduledTime(scheduledAt: string): string {
  return new Date(scheduledAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format date for calendar header.
 */
export function formatCalendarHeader(date: string, view: "month" | "week" | "day"): string {
  const d = new Date(date);

  if (view === "month") {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  if (view === "week") {
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/**
 * Get empty state message.
 */
export function getEmptyStateMessage(view: "month" | "week" | "day"): string {
  const messages = {
    month: "No scheduled emails this month",
    week: "No scheduled emails this week",
    day: "No scheduled emails today",
  };
  return messages[view];
}
