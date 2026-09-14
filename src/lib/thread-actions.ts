/**
 * Thread actions utility (Issue #532).
 *
 * Provides bulk operations on email threads: delete, archive, mark read/unread,
 * and multi-select functionality.
 */

import type { Email } from "@/types/email";
import type { Thread } from "@/types/thread";

export type ThreadAction = "delete" | "archive" | "markRead" | "markUnread" | "star";

export interface ThreadActionResult {
  success: boolean;
  action: ThreadAction;
  threadIds: string[];
  affectedEmails: number;
  timestamp: string;
}

export interface ThreadSelection {
  threadIds: string[];
  allSelected: boolean;
}

/**
 * Apply an action to a single thread's emails.
 */
export function applyActionToThread(
  thread: Thread,
  action: ThreadAction
): string[] {
  return thread.messages.map((email) => email.id);
}

/**
 * Get all email IDs from multiple threads.
 */
export function getEmailIdsFromThreads(
  threads: Thread[],
  threadIds: string[]
): string[] {
  const emailIds: string[] = [];
  for (const thread of threads) {
    if (threadIds.includes(thread.id)) {
      emailIds.push(...thread.messages.map((e) => e.id));
    }
  }
  return emailIds;
}

/**
 * Create a thread action result.
 */
export function createThreadActionResult(
  action: ThreadAction,
  threadIds: string[],
  affectedEmails: number
): ThreadActionResult {
  return {
    success: true,
    action,
    threadIds,
    affectedEmails,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Toggle thread selection.
 */
export function toggleThreadSelection(
  currentSelection: string[],
  threadId: string
): string[] {
  if (currentSelection.includes(threadId)) {
    return currentSelection.filter((id) => id !== threadId);
  }
  return [...currentSelection, threadId];
}

/**
 * Select all threads.
 */
export function selectAllThreads(threadIds: string[]): string[] {
  return [...threadIds];
}

/**
 * Clear all selections.
 */
export function clearSelection(): string[] {
  return [];
}

/**
 * Check if a thread is selected.
 */
export function isThreadSelected(
  selection: string[],
  threadId: string
): boolean {
  return selection.includes(threadId);
}

/**
 * Get the label for a thread action.
 */
export function getThreadActionLabel(action: ThreadAction): string {
  const labels: Record<ThreadAction, string> = {
    delete: "Delete thread",
    archive: "Archive thread",
    markRead: "Mark as read",
    markUnread: "Mark as unread",
    star: "Star thread",
  };
  return labels[action];
}

/**
 * Get the icon name for a thread action.
 */
export function getThreadActionIcon(action: ThreadAction): string {
  const icons: Record<ThreadAction, string> = {
    delete: "trash",
    archive: "archive",
    markRead: "mail-open",
    markUnread: "mail",
    star: "star",
  };
  return icons[action];
}

/**
 * Check if an action is destructive.
 */
export function isDestructiveAction(action: ThreadAction): boolean {
  return action === "delete";
}

/**
 * Get available thread actions.
 */
export function getAvailableThreadActions(): Array<{
  action: ThreadAction;
  label: string;
  icon: string;
  destructive: boolean;
}> {
  return [
    { action: "markRead", label: "Mark as read", icon: "mail-open", destructive: false },
    { action: "markUnread", label: "Mark as unread", icon: "mail", destructive: false },
    { action: "archive", label: "Archive", icon: "archive", destructive: false },
    { action: "star", label: "Star", icon: "star", destructive: false },
    { action: "delete", label: "Delete", icon: "trash", destructive: true },
  ];
}

/**
 * Count total emails in selected threads.
 */
export function countEmailsInThreads(
  threads: Thread[],
  threadIds: string[]
): number {
  return threads
    .filter((t) => threadIds.includes(t.id))
    .reduce((sum, t) => sum + t.messageCount, 0);
}

/**
 * Filter threads by selection.
 */
export function filterThreadsBySelection(
  threads: Thread[],
  threadIds: string[]
): Thread[] {
  return threads.filter((t) => threadIds.includes(t.id));
}
