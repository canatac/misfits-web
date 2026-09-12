/**
 * Thread Preview (Issue #477).
 *
 * Generates a concise preview of a conversation thread — a compact summary
 * suitable for list widgets, inbox overviews, and notification snippets.
 * Truncates message bodies intelligently and surfaces key metadata
 * (participants, unread count, last message date, attachment flag).
 */

import type { Thread } from "@/types/thread";
import type { Email, EmailAddress } from "@/types/email";

/** Summary of a thread for list/preview rendering. */
export interface ThreadPreview {
  /** Thread id. */
  id: string;
  /** Normalised subject line. */
  subject: string;
  /** Most recent message body, truncated to preview length. */
  previewText: string;
  /** Sender of the most recent message. */
  lastSender: string;
  /** ISO timestamp of the most recent message. */
  lastMessageDate: string;
  /** Total messages in the thread. */
  messageCount: number;
  /** Unread messages. */
  unreadCount: number;
  /** Whether the thread has any attachments. */
  hasAttachments: boolean;
  /** Participant display names (deduplicated, max 3 shown with +N indicator). */
  participantSummary: string;
}

/** Default preview text length in characters. */
export const DEFAULT_PREVIEW_LENGTH = 120;

/** Maximum number of participant names to show inline. */
const MAX_VISIBLE_PARTICIPANTS = 3;

/**
 * Strip HTML tags and collapse whitespace to get clean preview text.
 *
 * @param html Raw HTML or plain text body.
 * @returns Cleaned plain text.
 */
export function stripForPreview(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncate text to a given length, adding an ellipsis when truncated.
 *
 * @param text Input text (already cleaned).
 * @param maxLength Max character length.
 * @returns Truncated text.
 */
export function truncatePreview(text: string, maxLength: number = DEFAULT_PREVIEW_LENGTH): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength).trimEnd();
  return `${truncated}…`;
}

/**
 * Build a participant summary string from an array of participant names.
 *
 * Examples:
 * - `["Alice"]` → `"Alice"`
 * - `["Alice", "Bob"]` → `"Alice, Bob"`
 * - `["Alice", "Bob", "Charlie", "Dave"]` → `"Alice, Bob, Charlie +1"`
 *
 * @param participants Unique participant display names.
 * @returns Comma-separated summary with overflow indicator.
 */
export function buildParticipantSummary(participants: string[]): string {
  if (participants.length === 0) return "";

  const visible = participants.slice(0, MAX_VISIBLE_PARTICIPANTS);
  const overflow = participants.length - visible.length;

  if (overflow <= 0) return visible.join(", ");
  return `${visible.join(", ")} +${overflow}`;
}

/**
 * Generate a `ThreadPreview` from a `Thread` object.
 *
 * Selects the most recent message (last in chronological order) for the
 * preview text, extracts the sender, and summarises participants.
 *
 * @param thread The thread to preview.
 * @param previewLength Optional custom character limit.
 * @returns A `ThreadPreview` for rendering.
 */
export function buildThreadPreview(
  thread: Thread,
  previewLength: number = DEFAULT_PREVIEW_LENGTH
): ThreadPreview {
  const messages = thread.messages;
  const lastEmail = messages[messages.length - 1];

  const cleanedBody = stripForPreview(lastEmail.body);
  const previewText = truncatePreview(cleanedBody, previewLength);

  const participantNames = thread.participants.map((p: EmailAddress) => p.name || p.address);
  const participantSummary = buildParticipantSummary(participantNames);

  return {
    id: thread.id,
    subject: thread.subject,
    previewText,
    lastSender: lastEmail.from.name || lastEmail.from.address,
    lastMessageDate: thread.lastMessageDate,
    messageCount: thread.messageCount,
    unreadCount: thread.unreadCount,
    hasAttachments: thread.hasAttachments,
    participantSummary,
  };
}

/**
 * Select the "best" preview message from a thread.
 *
 * Prefers unread messages (most recent unread) over the absolute last
 * message, so the preview shows what the user has not yet seen.
 *
 * @param thread The thread to scan.
 * @returns The selected email, or null when thread is empty.
 */
export function selectPreviewMessage(thread: Thread): Email | null {
  if (thread.messages.length === 0) return null;

  // Find most recent unread message
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    if (!thread.messages[i].isRead) {
      return thread.messages[i];
    }
  }

  // Fall back to last message
  return thread.messages[thread.messages.length - 1];
}

/**
 * Build a preview with the preferred message (unread-aware).
 *
 * Like `buildThreadPreview` but selects the most relevant message
 * using `selectPreviewMessage` instead of always the last.
 *
 * @param thread The thread to preview.
 * @param previewLength Optional custom character limit.
 * @returns A `ThreadPreview` for rendering.
 */
export function buildThreadPreviewSmart(
  thread: Thread,
  previewLength: number = DEFAULT_PREVIEW_LENGTH
): ThreadPreview {
  const messages = thread.messages;
  if (messages.length === 0) {
    return {
      id: thread.id,
      subject: thread.subject,
      previewText: "",
      lastSender: "",
      lastMessageDate: thread.lastMessageDate,
      messageCount: 0,
      unreadCount: thread.unreadCount,
      hasAttachments: thread.hasAttachments,
      participantSummary: "",
    };
  }

  const selectedEmail = selectPreviewMessage(thread)!;
  const cleanedBody = stripForPreview(selectedEmail.body);
  const previewText = truncatePreview(cleanedBody, previewLength);

  const participantNames = thread.participants.map((p: EmailAddress) => p.name || p.address);
  const participantSummary = buildParticipantSummary(participantNames);

  return {
    id: thread.id,
    subject: thread.subject,
    previewText,
    lastSender: selectedEmail.from.name || selectedEmail.from.address,
    lastMessageDate: thread.lastMessageDate,
    messageCount: thread.messageCount,
    unreadCount: thread.unreadCount,
    hasAttachments: thread.hasAttachments,
    participantSummary,
  };
}
