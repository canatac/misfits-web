/**
 * Send later queue (Issue #457).
 *
 * Manage scheduled emails with edit, cancel, and send now actions.
 */

export interface ScheduledEmail {
  id: string;
  subject: string;
  recipient: string;
  body: string;
  scheduledAt: string;
  status: "pending" | "sent" | "cancelled";
}

export interface SendLaterQueue {
  emails: ScheduledEmail[];
}

/**
 * Create empty queue.
 */
export function createQueue(): SendLaterQueue {
  return { emails: [] };
}

/**
 * Add email to queue.
 */
export function addToQueue(queue: SendLaterQueue, email: ScheduledEmail): SendLaterQueue {
  return { ...queue, emails: [...queue.emails, email] };
}

/**
 * Remove email from queue.
 */
export function removeFromQueue(queue: SendLaterQueue, emailId: string): SendLaterQueue {
  return { ...queue, emails: queue.emails.filter((e) => e.id !== emailId) };
}

/**
 * Cancel a scheduled email.
 */
export function cancelScheduled(queue: SendLaterQueue, emailId: string): SendLaterQueue {
  return {
    ...queue,
    emails: queue.emails.map((e) =>
      e.id === emailId ? { ...e, status: "cancelled" } : e
    ),
  };
}

/**
 * Send email now (bypass schedule).
 */
export function sendNow(queue: SendLaterQueue, emailId: string): SendLaterQueue {
  return {
    ...queue,
    emails: queue.emails.map((e) =>
      e.id === emailId ? { ...e, status: "sent" } : e
    ),
  };
}

/**
 * Get pending emails.
 */
export function getPendingEmails(queue: SendLaterQueue): ScheduledEmail[] {
  return queue.emails.filter((e) => e.status === "pending");
}

/**
 * Get pending count.
 */
export function getPendingCount(queue: SendLaterQueue): number {
  return getPendingEmails(queue).length;
}

/**
 * Check if queue has pending emails.
 */
export function hasPendingEmails(queue: SendLaterQueue): boolean {
  return getPendingCount(queue) > 0;
}

/**
 * Get email by ID.
 */
export function getEmailById(queue: SendLaterQueue, emailId: string): ScheduledEmail | undefined {
  return queue.emails.find((e) => e.id === emailId);
}

/**
 * Update scheduled email.
 */
export function updateScheduledEmail(queue: SendLaterQueue, emailId: string, updates: Partial<ScheduledEmail>): SendLaterQueue {
  return {
    ...queue,
    emails: queue.emails.map((e) =>
      e.id === emailId ? { ...e, ...updates } : e
    ),
  };
}
