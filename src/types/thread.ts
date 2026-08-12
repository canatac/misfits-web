/**
 * Thread / conversation domain types for misfits.ai Mail.
 */
import type { Email, EmailAddress } from "@/types/email";

/** Threading strategy used to group emails into conversations. */
export type ThreadingMode =
  "bySubject" | "byReferences" | "byParticipants" | "smart";

/** A single message within a thread (wraps an Email with UI state). */
export interface ThreadMessage {
  email: Email;
  /** Whether this message is collapsed in the thread view. */
  isCollapsed: boolean;
}

/** A conversation — one or more emails grouped together. */
export interface Thread {
  id: string;
  /** Normalised subject (Re:/Fwd: prefixes stripped). */
  subject: string;
  /** All emails in this thread, sorted chronologically (oldest first). */
  messages: Email[];
  /** Unique participants across all messages. */
  participants: EmailAddress[];
  /** ISO date string of the most recent message. */
  lastMessageDate: string;
  /** ISO date string of the first message. */
  firstMessageDate: string;
  /** Number of unread messages in the thread. */
  unreadCount: number;
  /** Total messages in the thread. */
  messageCount: number;
  /** True if any message has attachments. */
  hasAttachments: boolean;
  /** Merged labels from all messages (deduplicated). */
  labels: string[];
  /** Folder of the most recent message. */
  folder: string;
}

/** A collection of threads with aggregate counts. */
export interface ThreadGroup {
  threads: Thread[];
  totalCount: number;
  unreadCount: number;
}
