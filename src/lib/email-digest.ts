/**
 * Email digest mode (Issue #463).
 *
 * Groups emails by sender/topic for batch triage with unread counts,
 * collapse/expand, and group-level actions.
 */

export interface EmailDigestEntry {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

export interface DigestGroup {
  id: string;
  senderName: string;
  senderEmail: string;
  emails: EmailDigestEntry[];
  unreadCount: number;
  collapsed: boolean;
  latestTimestamp: string;
}

export interface DigestState {
  enabled: boolean;
  groups: DigestGroup[];
  totalUnread: number;
  totalEmails: number;
}

/**
 * Group emails by sender email.
 */
export function groupEmailsBySender(emails: EmailDigestEntry[]): DigestGroup[] {
  const groups = new Map<string, DigestGroup>();

  for (const email of emails) {
    const existing = groups.get(email.senderEmail);
    if (existing) {
      existing.emails.push(email);
      if (email.unread) existing.unreadCount++;
      if (email.timestamp > existing.latestTimestamp) {
        existing.latestTimestamp = email.timestamp;
      }
    } else {
      groups.set(email.senderEmail, {
        id: `group-${email.senderEmail}`,
        senderName: email.senderName,
        senderEmail: email.senderEmail,
        emails: [email],
        unreadCount: email.unread ? 1 : 0,
        collapsed: false,
        latestTimestamp: email.timestamp,
      });
    }
  }

  return Array.from(groups.values());
}

/**
 * Sort groups by latest timestamp (most recent first).
 */
export function sortGroupsByRecent(groups: DigestGroup[]): DigestGroup[] {
  return [...groups].sort((a, b) => 
    new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime()
  );
}

/**
 * Toggle collapsed state of a group.
 */
export function toggleGroupCollapsed(groups: DigestGroup[], groupId: string): DigestGroup[] {
  return groups.map((g) =>
    g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
  );
}

/**
 * Collapse all groups.
 */
export function collapseAllGroups(groups: DigestGroup[]): DigestGroup[] {
  return groups.map((g) => ({ ...g, collapsed: true }));
}

/**
 * Expand all groups.
 */
export function expandAllGroups(groups: DigestGroup[]): DigestGroup[] {
  return groups.map((g) => ({ ...g, collapsed: false }));
}

/**
 * Count total unread across all groups.
 */
export function countTotalUnread(groups: DigestGroup[]): number {
  return groups.reduce((sum, g) => sum + g.unreadCount, 0);
}

/**
 * Count total emails across all groups.
 */
export function countTotalEmails(groups: DigestGroup[]): number {
  return groups.reduce((sum, g) => sum + g.emails.length, 0);
}

/**
 * Create digest state.
 */
export function createDigestState(emails: EmailDigestEntry[], enabled: boolean = true): DigestState {
  const groups = groupEmailsBySender(emails);
  const sorted = sortGroupsByRecent(groups);
  return {
    enabled,
    groups: sorted,
    totalUnread: countTotalUnread(sorted),
    totalEmails: countTotalEmails(sorted),
  };
}

/**
 * Toggle digest mode.
 */
export function toggleDigest(state: DigestState): DigestState {
  return {
    ...state,
    enabled: !state.enabled,
  };
}

/**
 * Mark all emails in a group as read.
 */
export function markGroupAsRead(groups: DigestGroup[], groupId: string): DigestGroup[] {
  return groups.map((g) => {
    if (g.id !== groupId) return g;
    return {
      ...g,
      unreadCount: 0,
      emails: g.emails.map((e) => ({ ...e, unread: false })),
    };
  });
}

/**
 * Archive all emails in a group (remove them).
 */
export function archiveGroup(groups: DigestGroup[], groupId: string): DigestGroup[] {
  return groups.filter((g) => g.id !== groupId);
}

/**
 * Check if digest is enabled.
 */
export function isDigestEnabled(state: DigestState): boolean {
  return state.enabled;
}

/**
 * Get digest summary.
 */
export function getDigestSummary(state: DigestState): string {
  if (state.totalUnread === 0) return "No unread emails";
  if (state.totalUnread === 1) return "1 unread email";
  return `${state.totalUnread} unread emails`;
}

/**
 * Get empty state message.
 */
export function getEmptyStateMessage(state: DigestState): string | null {
  if (state.totalEmails === 0) return "No emails to show";
  if (state.totalUnread === 0) return "No unread emails";
  return null;
}
