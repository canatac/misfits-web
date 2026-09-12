// send-later-queue.ts — queue management for scheduled (send-later) emails.

export interface QueuedEmail {
  /** Unique queue entry id */
  id: string;
  /** Serialized draft content (RFC822-ish JSON shape) */
  draft: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    bodyType: "html" | "text";
    attachments?: { name: string; size: number; contentType: string }[];
  };
  /** ISO timestamp when the email should be sent */
  scheduledAt: string;
  /** ISO timestamp when the entry was enqueued */
  enqueuedAt: string;
  /** Current status of the queued entry */
  status: "pending" | "processing" | "sent" | "failed";
  /** Number of delivery attempts made */
  attempts: number;
  /** Optional error message when status === 'failed' */
  error?: string;
}

export interface SendLaterQueueSnapshot {
  items: QueuedEmail[];
}

/**
 * Create a new queued email entry with defaults.
 */
export function createQueuedEmail(
  draft: QueuedEmail["draft"],
  scheduledAt: string
): QueuedEmail {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    draft,
    scheduledAt,
    enqueuedAt: now,
    status: "pending",
    attempts: 0,
  };
}

/**
 * Return only entries that are pending and whose scheduledAt is <= now.
 */
export function dequeueDue(items: QueuedEmail[], now: Date = new Date()): QueuedEmail[] {
  const ts = now.getTime();
  return items
    .filter((item) => item.status === "pending")
    .filter((item) => new Date(item.scheduledAt).getTime() <= ts)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/**
 * Mark an item as processing.
 */
export function markProcessing(item: QueuedEmail): QueuedEmail {
  return { ...item, status: "processing" };
}

/**
 * Mark an item as sent.
 */
export function markSent(item: QueuedEmail): QueuedEmail {
  return { ...item, status: "sent" };
}

/**
 * Mark an item as failed with optional error message.
 */
export function markFailed(item: QueuedEmail, error?: string): QueuedEmail {
  return {
    ...item,
    status: "failed",
    attempts: item.attempts + 1,
    error,
  };
}

/**
 * Retry a failed entry: reset to pending and clear error.
 */
export function retryFailed(item: QueuedEmail): QueuedEmail | null {
  if (item.status !== "failed") return null;
  return {
    ...item,
    status: "pending",
    error: undefined,
  };
}

/**
 * Validate a QueuedEmail object shape.
 */
export function isValidQueuedEmail(value: unknown): value is QueuedEmail {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.draft === "object" &&
    v.draft !== null &&
    typeof v.scheduledAt === "string" &&
    typeof v.enqueuedAt === "string" &&
    typeof v.status === "string" &&
    typeof v.attempts === "number"
  );
}

/**
 * Serialize queue to JSON-safe snapshot.
 */
export function serializeQueue(items: QueuedEmail[]): string {
  return JSON.stringify({ items });
}

/**
 * Deserialize a snapshot into a QueuedEmail array. Invalid entries are filtered out.
 */
export function deserializeQueue(raw: string): QueuedEmail[] {
  try {
    const parsed = JSON.parse(raw) as SendLaterQueueSnapshot;
    if (!parsed || !Array.isArray(parsed.items)) return [];
    return parsed.items.filter(isValidQueuedEmail);
  } catch {
    return [];
  }
}
