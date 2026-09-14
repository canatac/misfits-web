/**
 * Scheduled send utility (Issue #517).
 *
 * Manages scheduled email sending with date/time selection,
 * cancellation, and automatic sending at the scheduled time.
 */

export interface ScheduledEmail {
  id: string;
  emailId: string;
  scheduledAt: string;
  status: "pending" | "sent" | "cancelled" | "failed";
  createdAt: string;
  sentAt?: string;
  error?: string;
}

export interface ScheduleEmailInput {
  emailId: string;
  scheduledAt: string;
}

export interface ScheduleEmailResult {
  success: boolean;
  scheduledId?: string;
  error?: string;
}

export interface ScheduledSendStats {
  total: number;
  pending: number;
  sent: number;
  cancelled: number;
  failed: number;
}

const MIN_SCHEDULE_HOURS = 24; // Must schedule at least 24h in advance

/**
 * Create a scheduled email entry.
 */
export function createScheduledEmail(input: ScheduleEmailInput): ScheduledEmail {
  return {
    id: `sched-${Date.now()}`,
    emailId: input.emailId,
    scheduledAt: input.scheduledAt,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validate a scheduled send time.
 */
export function validateScheduleTime(scheduledAt: string): {
  valid: boolean;
  error?: string;
} {
  const scheduleDate = new Date(scheduledAt);
  const now = new Date();
  const minDate = new Date(now.getTime() + MIN_SCHEDULE_HOURS * 60 * 60 * 1000);

  if (isNaN(scheduleDate.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  if (scheduleDate <= now) {
    return { valid: false, error: "Scheduled time must be in the future" };
  }

  if (scheduleDate < minDate) {
    return {
      valid: false,
      error: `Must schedule at least ${MIN_SCHEDULE_HOURS} hours in advance`,
    };
  }

  return { valid: true };
}

/**
 * Check if a scheduled email is due to be sent.
 */
export function isScheduledEmailDue(scheduled: ScheduledEmail): boolean {
  if (scheduled.status !== "pending") return false;
  const scheduleDate = new Date(scheduled.scheduledAt);
  return scheduleDate <= new Date();
}

/**
 * Check if a scheduled email can be cancelled.
 */
export function canCancelScheduled(scheduled: ScheduledEmail): boolean {
  return scheduled.status === "pending";
}

/**
 * Cancel a scheduled email.
 */
export function cancelScheduledEmail(scheduled: ScheduledEmail): ScheduledEmail {
  if (!canCancelScheduled(scheduled)) {
    return scheduled;
  }
  return { ...scheduled, status: "cancelled" };
}

/**
 * Mark a scheduled email as sent.
 */
export function markScheduledAsSent(scheduled: ScheduledEmail): ScheduledEmail {
  return {
    ...scheduled,
    status: "sent",
    sentAt: new Date().toISOString(),
  };
}

/**
 * Mark a scheduled email as failed.
 */
export function markScheduledAsFailed(scheduled: ScheduledEmail, error: string): ScheduledEmail {
  return { ...scheduled, status: "failed", error };
}

/**
 * Get scheduled emails that are due for sending.
 */
export function getDueScheduledEmails(scheduledEmails: ScheduledEmail[]): ScheduledEmail[] {
  return scheduledEmails.filter(isScheduledEmailDue);
}

/**
 * Get pending scheduled emails.
 */
export function getPendingScheduledEmails(scheduledEmails: ScheduledEmail[]): ScheduledEmail[] {
  return scheduledEmails.filter((s) => s.status === "pending");
}

/**
 * Sort scheduled emails by scheduled time (earliest first).
 */
export function sortScheduledByTime(scheduledEmails: ScheduledEmail[]): ScheduledEmail[] {
  return [...scheduledEmails].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

/**
 * Compute statistics for scheduled emails.
 */
export function computeScheduledStats(scheduledEmails: ScheduledEmail[]): ScheduledSendStats {
  return {
    total: scheduledEmails.length,
    pending: scheduledEmails.filter((s) => s.status === "pending").length,
    sent: scheduledEmails.filter((s) => s.status === "sent").length,
    cancelled: scheduledEmails.filter((s) => s.status === "cancelled").length,
    failed: scheduledEmails.filter((s) => s.status === "failed").length,
  };
}

/**
 * Get the minimum schedule advance time in hours.
 */
export function getMinScheduleHours(): number {
  return MIN_SCHEDULE_HOURS;
}

/**
 * Format scheduled time for display.
 */
export function formatScheduledTime(scheduledAt: string): string {
  const date = new Date(scheduledAt);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Get a human-readable status label.
 */
export function getScheduledStatusLabel(status: ScheduledEmail["status"]): string {
  const labels: Record<ScheduledEmail["status"], string> = {
    pending: "Scheduled",
    sent: "Sent",
    cancelled: "Cancelled",
    failed: "Failed",
  };
  return labels[status];
}
