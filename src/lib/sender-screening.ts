/**
 * First-Time Sender Screening utility (Issue #504).
 *
 * Implements HEY-style sender screening where unknown senders are held
 * in a pending queue until the user approves, blocks, or moves them to feed.
 */

export type SenderStatus = "pending" | "allowed" | "blocked" | "feed";

export interface SenderRecord {
  id: string;
  email: string;
  name?: string;
  status: SenderStatus;
  firstSeen: string;
  lastEmailAt: string;
  emailCount: number;
  decidedAt?: string;
}

export interface ScreeningSettings {
  enabled: boolean;
  autoAllowContacts: boolean;
  pendingCount: number;
}

export interface ScreeningAction {
  senderId: string;
  action: "allow" | "block" | "feed";
  timestamp: string;
}

/**
 * Create a sender record.
 */
let senderCounter = 0;

export function createSenderRecord(email: string, name?: string): SenderRecord {
  senderCounter++;
  return {
    id: `sender-${Date.now()}-${senderCounter}`,
    email: email.toLowerCase(),
    name,
    status: "pending",
    firstSeen: new Date().toISOString(),
    lastEmailAt: new Date().toISOString(),
    emailCount: 1,
  };
}

/**
 * Check if a sender is known (allowed, blocked, or feed).
 */
export function isSenderKnown(
  sender: SenderRecord
): boolean {
  return sender.status !== "pending";
}

/**
 * Check if sender is allowed.
 */
export function isSenderAllowed(sender: SenderRecord): boolean {
  return sender.status === "allowed";
}

/**
 * Check if sender is blocked.
 */
export function isSenderBlocked(sender: SenderRecord): boolean {
  return sender.status === "blocked";
}

/**
 * Check if sender is in feed.
 */
export function isSenderFeed(sender: SenderRecord): boolean {
  return sender.status === "feed";
}

/**
 * Allow a sender.
 */
export function allowSender(sender: SenderRecord): SenderRecord {
  return {
    ...sender,
    status: "allowed",
    decidedAt: new Date().toISOString(),
  };
}

/**
 * Block a sender.
 */
export function blockSender(sender: SenderRecord): SenderRecord {
  return {
    ...sender,
    status: "blocked",
    decidedAt: new Date().toISOString(),
  };
}

/**
 * Move sender to feed.
 */
export function moveSenderToFeed(sender: SenderRecord): SenderRecord {
  return {
    ...sender,
    status: "feed",
    decidedAt: new Date().toISOString(),
  };
}

/**
 * Record email from sender.
 */
export function recordSenderEmail(sender: SenderRecord): SenderRecord {
  return {
    ...sender,
    lastEmailAt: new Date().toISOString(),
    emailCount: sender.emailCount + 1,
  };
}

/**
 * Get pending senders.
 */
export function getPendingSenders(senders: SenderRecord[]): SenderRecord[] {
  return senders.filter((s) => s.status === "pending");
}

/**
 * Get allowed senders.
 */
export function getAllowedSenders(senders: SenderRecord[]): SenderRecord[] {
  return senders.filter((s) => s.status === "allowed");
}

/**
 * Get blocked senders.
 */
export function getBlockedSenders(senders: SenderRecord[]): SenderRecord[] {
  return senders.filter((s) => s.status === "blocked");
}

/**
 * Get feed senders.
 */
export function getFeedSenders(senders: SenderRecord[]): SenderRecord[] {
  return senders.filter((s) => s.status === "feed");
}

/**
 * Find sender by email.
 */
export function findSenderByEmail(
  senders: SenderRecord[],
  email: string
): SenderRecord | undefined {
  return senders.find((s) => s.email === email.toLowerCase());
}

/**
 * Apply screening action.
 */
export function applyScreeningAction(
  sender: SenderRecord,
  action: "allow" | "block" | "feed"
): SenderRecord {
  switch (action) {
    case "allow":
      return allowSender(sender);
    case "block":
      return blockSender(sender);
    case "feed":
      return moveSenderToFeed(sender);
    default:
      return sender;
  }
}

/**
 * Get screening settings with defaults.
 */
export function getDefaultScreeningSettings(): ScreeningSettings {
  return {
    enabled: false,
    autoAllowContacts: true,
    pendingCount: 0,
  };
}

/**
 * Update screening settings.
 */
export function updateScreeningSettings(
  settings: ScreeningSettings,
  updates: Partial<ScreeningSettings>
): ScreeningSettings {
  return { ...settings, ...updates };
}

/**
 * Get sender status label.
 */
export function getSenderStatusLabel(status: SenderStatus): string {
  const labels: Record<SenderStatus, string> = {
    pending: "Pending",
    allowed: "Allowed",
    blocked: "Blocked",
    feed: "Feed",
  };
  return labels[status];
}

/**
 * Get sender status color.
 */
export function getSenderStatusColor(status: SenderStatus): string {
  const colors: Record<SenderStatus, string> = {
    pending: "text-yellow-500",
    allowed: "text-green-500",
    blocked: "text-red-500",
    feed: "text-blue-500",
  };
  return colors[status];
}

/**
 * Check if email should be screened.
 */
export function shouldScreenEmail(
  sender: SenderRecord | undefined,
  settings: ScreeningSettings
): boolean {
  if (!settings.enabled) return false;
  if (!sender) return true; // Unknown sender
  return sender.status === "pending";
}

/**
 * Check if email should be blocked.
 */
export function shouldBlockEmail(
  sender: SenderRecord | undefined
): boolean {
  if (!sender) return false;
  return sender.status === "blocked";
}

/**
 * Get pending count.
 */
export function getPendingCount(senders: SenderRecord[]): number {
  return getPendingSenders(senders).length;
}

/**
 * Sort pending senders by first seen (oldest first).
 */
export function sortPendingByDate(senders: SenderRecord[]): SenderRecord[] {
  return [...getPendingSenders(senders)].sort(
    (a, b) => new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime()
  );
}

/**
 * Bulk apply action to multiple senders.
 */
export function bulkApplyAction(
  senders: SenderRecord[],
  senderIds: string[],
  action: "allow" | "block" | "feed"
): SenderRecord[] {
  return senders.map((s) =>
    senderIds.includes(s.id) ? applyScreeningAction(s, action) : s
  );
}
