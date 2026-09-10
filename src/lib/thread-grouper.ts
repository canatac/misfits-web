/**
 * Thread grouping utility — groups emails into conversations.
 *
 * Groups emails by threadId (or References/In-Reply-To headers) and produces
 * Thread objects with aggregate metadata (message count, unread count, etc.).
 */

import type { Email, EmailAddress } from "@/types/email";
import type { Thread, ThreadGroup } from "@/types/thread";

/**
 * Normalize a subject line by stripping Re:/Fwd: prefixes.
 */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(Re|Fwd|Fw|Aw|Antwort|Tr|I)\s*:\s*/gi, "")
    .trim();
}

/**
 * Get the thread key for an email.
 * Uses threadId if available, otherwise falls back to normalized subject.
 */
function getThreadKey(email: Email): string {
  if (email.threadId) return email.threadId;
  return normalizeSubject(email.subject);
}

/**
 * Get unique participants from a list of emails.
 */
function getParticipants(emails: Email[]): EmailAddress[] {
  const seen = new Set<string>();
  const participants: EmailAddress[] = [];
  for (const email of emails) {
    const addr = email.from.address.toLowerCase();
    if (!seen.has(addr)) {
      seen.add(addr);
      participants.push(email.from);
    }
    for (const to of email.to) {
      const toAddr = to.address.toLowerCase();
      if (!seen.has(toAddr)) {
        seen.add(toAddr);
        participants.push(to);
      }
    }
  }
  return participants;
}

/**
 * Get merged labels from a list of emails.
 */
function getMergedLabels(emails: Email[]): string[] {
  const labels = new Set<string>();
  for (const email of emails) {
    for (const label of email.labels) {
      labels.add(label);
    }
  }
  return Array.from(labels);
}

/**
 * Group emails into threads.
 */
export function groupEmailsIntoThreads(emails: Email[]): ThreadGroup {
  const threadMap = new Map<string, Email[]>();

  for (const email of emails) {
    const key = getThreadKey(email);
    if (!threadMap.has(key)) {
      threadMap.set(key, []);
    }
    threadMap.get(key)!.push(email);
  }

  const threads: Thread[] = [];
  for (const [, threadEmails] of threadMap) {
    // Sort chronologically (oldest first)
    const sorted = [...threadEmails].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const lastMessage = sorted[sorted.length - 1];
    const firstMessage = sorted[0];
    const unreadCount = sorted.filter((e) => !e.isRead).length;
    const hasAttachments = sorted.some((e) => e.hasAttachments);

    threads.push({
      id: getThreadKey(lastMessage),
      subject: normalizeSubject(lastMessage.subject),
      messages: sorted,
      participants: getParticipants(sorted),
      lastMessageDate: lastMessage.date,
      firstMessageDate: firstMessage.date,
      unreadCount,
      messageCount: sorted.length,
      hasAttachments,
      labels: getMergedLabels(sorted),
      folder: lastMessage.folder,
    });
  }

  // Sort threads by most recent message first
  threads.sort(
    (a, b) =>
      new Date(b.lastMessageDate).getTime() -
      new Date(a.lastMessageDate).getTime()
  );

  return {
    threads,
    totalCount: threads.length,
    unreadCount: threads.reduce((sum, t) => sum + t.unreadCount, 0),
  };
}

/**
 * Get the latest message in a thread.
 */
export function getLatestMessage(thread: Thread): Email {
  return thread.messages[thread.messages.length - 1];
}

/**
 * Check if a thread has unread messages.
 */
export function isThreadUnread(thread: Thread): boolean {
  return thread.unreadCount > 0;
}

/**
 * Get the preview text for a thread (from the latest message).
 */
export function getThreadPreview(thread: Thread): string {
  const latest = getLatestMessage(thread);
  return latest.preview || latest.subject;
}
