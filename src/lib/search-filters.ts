/**
 * Search filter utilities (Issue #533).
 *
 * Provides helper functions for filtering emails by date range, sender,
 * attachments, and combining multiple filters with logical AND.
 */

import type { Email } from "@/types/email";

export type DateRange = "today" | "week" | "month" | "year" | "custom";

export interface SearchFilterOptions {
  /** Date range filter */
  dateRange?: DateRange;
  /** Custom start date (for custom range) */
  startDate?: string;
  /** Custom end date (for custom range) */
  endDate?: string;
  /** Filter by sender email or name */
  sender?: string;
  /** Filter by attachment presence */
  hasAttachments?: boolean;
  /** Filter by read status */
  isRead?: boolean;
  /** Filter by starred status */
  isStarred?: boolean;
  /** Filter by folder */
  folder?: string;
}

/**
 * Get the start date for a predefined date range.
 */
export function getDateRangeStart(range: DateRange): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (range) {
    case "today":
      return now;
    case "week": {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return weekStart;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "custom":
      return now;
    default:
      return now;
  }
}

/**
 * Get the end date for a predefined date range.
 */
export function getDateRangeEnd(range: DateRange): Date {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  switch (range) {
    case "today":
      return now;
    case "week": {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - now.getDay() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return weekEnd;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    case "year":
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    case "custom":
      return now;
    default:
      return now;
  }
}

/**
 * Filter emails by date range.
 */
export function filterByDateRange(
  emails: Email[],
  range: DateRange,
  customStart?: string,
  customEnd?: string
): Email[] {
  let startDate: Date;
  let endDate: Date;

  if (range === "custom" && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate = getDateRangeStart(range);
    endDate = getDateRangeEnd(range);
  }

  return emails.filter((email) => {
    const emailDate = new Date(email.date);
    return emailDate >= startDate && emailDate <= endDate;
  });
}

/**
 * Filter emails by sender (matches email or name).
 */
export function filterBySender(emails: Email[], sender: string): Email[] {
  const lower = sender.toLowerCase();
  return emails.filter(
    (email) =>
      email.from.address.toLowerCase().includes(lower) ||
      email.from.name.toLowerCase().includes(lower)
  );
}

/**
 * Filter emails by attachment presence.
 */
export function filterByAttachments(emails: Email[], hasAttachments: boolean): Email[] {
  return emails.filter((email) => email.hasAttachments === hasAttachments);
}

/**
 * Filter emails by read status.
 */
export function filterByReadStatus(emails: Email[], isRead: boolean): Email[] {
  return emails.filter((email) => email.isRead === isRead);
}

/**
 * Filter emails by starred status.
 */
export function filterByStarred(emails: Email[], isStarred: boolean): Email[] {
  return emails.filter((email) => email.isStarred === isStarred);
}

/**
 * Filter emails by folder.
 */
export function filterByFolder(emails: Email[], folder: string): Email[] {
  return emails.filter((email) => email.folder === folder);
}

/**
 * Apply multiple filters with logical AND.
 */
export function applyFilters(
  emails: Email[],
  options: SearchFilterOptions
): Email[] {
  let result = [...emails];

  if (options.dateRange) {
    result = filterByDateRange(result, options.dateRange, options.startDate, options.endDate);
  }

  if (options.sender) {
    result = filterBySender(result, options.sender);
  }

  if (options.hasAttachments !== undefined) {
    result = filterByAttachments(result, options.hasAttachments);
  }

  if (options.isRead !== undefined) {
    result = filterByReadStatus(result, options.isRead);
  }

  if (options.isStarred !== undefined) {
    result = filterByStarred(result, options.isStarred);
  }

  if (options.folder) {
    result = filterByFolder(result, options.folder);
  }

  return result;
}

/**
 * Get a human-readable label for a date range.
 */
export function getDateRangeLabel(range: DateRange): string {
  const labels: Record<DateRange, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    custom: "Custom Range",
  };
  return labels[range];
}

/**
 * Get all available date range options.
 */
export function getDateRangeOptions(): Array<{ value: DateRange; label: string }> {
  return [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];
}

/**
 * Count emails matching each filter facet.
 */
export function computeFilterFacets(emails: Email[]): {
  total: number;
  withAttachments: number;
  unread: number;
  starred: number;
  byFolder: Record<string, number>;
} {
  const byFolder: Record<string, number> = {};

  for (const email of emails) {
    byFolder[email.folder] = (byFolder[email.folder] ?? 0) + 1;
  }

  return {
    total: emails.length,
    withAttachments: emails.filter((e) => e.hasAttachments).length,
    unread: emails.filter((e) => !e.isRead).length,
    starred: emails.filter((e) => e.isStarred).length,
    byFolder,
  };
}
