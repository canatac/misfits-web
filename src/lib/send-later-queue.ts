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
  scheduledAt: number;
  status: "pending" | "sent" | "cancelled";
}

export interface QueueStats {
  total: number;
  nextScheduledAt: number | null;
}

export class SendLaterQueue {
  private items: ScheduledEmail[] = [];

  enqueue(email: ScheduledEmail): void {
    this.items.push(email);
    this.items.sort((a, b) => a.scheduledAt - b.scheduledAt);
  }

  dequeue(now: number = Date.now()): ScheduledEmail | null {
    if (this.items.length === 0) return null;
    if (this.items[0].scheduledAt <= now) return this.items.shift()!;
    return null;
  }

  dequeueDue(now: number = Date.now()): ScheduledEmail[] {
    const due: ScheduledEmail[] = [];
    while (this.items.length > 0 && this.items[0].scheduledAt <= now) {
      due.push(this.items.shift()!);
    }
    return due;
  }

  cancel(id: string): boolean {
    const idx = this.items.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }

  peek(): ScheduledEmail | null {
    return this.items[0] ?? null;
  }

  getAll(): ScheduledEmail[] {
    return [...this.items];
  }

  get size(): number {
    return this.items.length;
  }

  stats(): QueueStats {
    return {
      total: this.items.length,
      nextScheduledAt: this.items[0]?.scheduledAt ?? null,
    };
  }

  clear(): void {
    this.items = [];
  }
}

export const sendLaterQueue = new SendLaterQueue();

/**
 * Plain-object queue shape for functional helpers.
 */
export interface EmailQueue {
  emails: ScheduledEmail[];
}

/**
 * Create empty queue.
 */
export function createQueue(): EmailQueue {
  return { emails: [] };
}

/**
 * Add email to queue.
 */
export function addToQueue(queue: EmailQueue, email: ScheduledEmail): EmailQueue {
  return { ...queue, emails: [...queue.emails, email] };
}

/**
 * Remove email from queue.
 */
export function removeFromQueue(queue: EmailQueue, emailId: string): EmailQueue {
  return { ...queue, emails: queue.emails.filter((e) => e.id !== emailId) };
}

/**
 * Cancel a scheduled email.
 */
export function cancelScheduled(queue: EmailQueue, emailId: string): EmailQueue {
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
export function sendNow(queue: EmailQueue, emailId: string): EmailQueue {
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
export function getPendingEmails(queue: EmailQueue): ScheduledEmail[] {
  return queue.emails.filter((e) => e.status === "pending");
}

/**
 * Get pending count.
 */
export function getPendingCount(queue: EmailQueue): number {
  return getPendingEmails(queue).length;
}

/**
 * Check if queue has pending emails.
 */
export function hasPendingEmails(queue: EmailQueue): boolean {
  return getPendingCount(queue) > 0;
}

/**
 * Get email by ID.
 */
export function getEmailById(queue: EmailQueue, emailId: string): ScheduledEmail | undefined {
  return queue.emails.find((e) => e.id === emailId);
}

/**
 * Update scheduled email.
 */
export function updateScheduledEmail(queue: EmailQueue, emailId: string, updates: Partial<ScheduledEmail>): EmailQueue {
  return {
    ...queue,
    emails: queue.emails.map((e) =>
      e.id === emailId ? { ...e, ...updates } : e
    ),
  };
}
