/**
 * Pure filter/sort utilities for the email store.
 */
import type { Email, FilterType, SortBy } from "@/types/email";

export function sortEmails(emails: Email[], sortBy: SortBy): Email[] {
  const sorted = [...emails];
  switch (sortBy) {
    case "date":
      return sorted.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    case "sender":
      return sorted.sort((a, b) => a.from.name.localeCompare(b.from.name));
    case "subject":
      return sorted.sort((a, b) => a.subject.localeCompare(b.subject));
    case "size":
      return sorted.sort((a, b) => b.size - a.size);
    case "unreadFirst":
      return sorted.sort((a, b) => {
        if (a.isRead === b.isRead) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.isRead ? 1 : -1;
      });
    default:
      return sorted;
  }
}

export function filterEmails(
  emails: Email[],
  filterType: FilterType,
  searchQuery: string,
  accountId: string | null
): Email[] {
  let result = emails;
  // Account filter (Issue #154): null = unified (all accounts). Untagged emails
  // (no accountId) are shown in every account's view so legacy mock data stays visible.
  if (accountId !== null) {
    result = result.filter(
      (e) => e.accountId === undefined || e.accountId === accountId
    );
  }
  switch (filterType) {
    case "unread":
      result = result.filter((e) => !e.isRead);
      break;
    case "starred":
      result = result.filter((e) => e.isStarred);
      break;
    case "attachments":
      result = result.filter((e) => e.hasAttachments);
      break;
    case "all":
    default:
      break;
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.from.name.toLowerCase().includes(q) ||
        e.from.address.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
    );
  }
  return result;
}

/** Bulk action mutator: applies an action to an email, may drop it (null). */
export type BulkActionType =
  | "archive"
  | "delete"
  | "markRead"
  | "markUnread"
  | "star"
  | "unstar";

export function applyBulkAction(email: Email, action: BulkActionType): Email | null {
  switch (action) {
    case "archive":
      return { ...email, folder: "archive" as Email["folder"] };
    case "delete":
      return null;
    case "markRead":
      return { ...email, isRead: true };
    case "markUnread":
      return { ...email, isRead: false };
    case "star":
      return { ...email, isStarred: true };
    case "unstar":
      return { ...email, isStarred: false };
    default:
      return email;
  }
}
