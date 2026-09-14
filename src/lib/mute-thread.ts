/**
 * Mute Thread utility (Issue #482).
 *
 * Provides functionality to mute/unmute email threads to stop notifications
 * for noisy conversations. Supports temporary and permanent muting.
 */

export type MuteDuration = "permanent" | "1h" | "8h" | "24h" | "7d" | "30d";

export interface MutedThread {
  threadId: string;
  mutedAt: string;
  expiresAt: string | null;
  duration: MuteDuration;
  reason?: string;
}

export interface MuteResult {
  success: boolean;
  threadId: string;
  expiresAt: string | null;
  message: string;
}

/**
 * Create a muted thread entry.
 */
export function muteThread(threadId: string, duration: MuteDuration = "permanent", reason?: string): MutedThread {
  const now = new Date();
  let expiresAt: string | null = null;

  if (duration !== "permanent") {
    const hours = parseDurationToHours(duration);
    expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
  }

  return {
    threadId,
    mutedAt: now.toISOString(),
    expiresAt,
    duration,
    reason,
  };
}

/**
 * Unmute a thread.
 */
export function unmutedThread(muted: MutedThread): MutedThread {
  return {
    ...muted,
    expiresAt: new Date().toISOString(),
    duration: "permanent",
  };
}

/**
 * Check if a thread is currently muted.
 */
export function isThreadMuted(mutedThreads: MutedThread[], threadId: string): boolean {
  const muted = mutedThreads.find((m) => m.threadId === threadId);
  if (!muted) return false;

  // Permanent mute
  if (!muted.expiresAt) return true;

  // Check if expired
  return new Date(muted.expiresAt) > new Date();
}

/**
 * Get mute status for a thread.
 */
export function getMuteStatus(mutedThreads: MutedThread[], threadId: string): {
  muted: boolean;
  expiresAt: string | null;
  duration: MuteDuration | null;
} {
  const muted = mutedThreads.find((m) => m.threadId === threadId);
  if (!muted) return { muted: false, expiresAt: null, duration: null };

  if (!muted.expiresAt) {
    return { muted: true, expiresAt: null, duration: muted.duration };
  }

  const isExpired = new Date(muted.expiresAt) <= new Date();
  return {
    muted: !isExpired,
    expiresAt: muted.expiresAt,
    duration: isExpired ? null : muted.duration,
  };
}

/**
 * Get all muted threads.
 */
export function getMutedThreads(mutedThreads: MutedThread[]): MutedThread[] {
  return mutedThreads.filter((m) => {
    if (!m.expiresAt) return true;
    return new Date(m.expiresAt) > new Date();
  });
}

/**
 * Get expired mutes that should be cleaned up.
 */
export function getExpiredMutes(mutedThreads: MutedThread[]): MutedThread[] {
  return mutedThreads.filter((m) => {
    if (!m.expiresAt) return false;
    return new Date(m.expiresAt) <= new Date();
  });
}

/**
 * Clean up expired mutes.
 */
export function cleanupExpiredMutes(mutedThreads: MutedThread[]): MutedThread[] {
  return getMutedThreads(mutedThreads);
}

/**
 * Get mute duration in hours.
 */
export function parseDurationToHours(duration: MuteDuration): number {
  switch (duration) {
    case "1h": return 1;
    case "8h": return 8;
    case "24h": return 24;
    case "7d": return 24 * 7;
    case "30d": return 24 * 30;
    case "permanent": return 0;
    default: return 0;
  }
}

/**
 * Format mute duration for display.
 */
export function formatMuteDuration(duration: MuteDuration): string {
  const labels: Record<MuteDuration, string> = {
    permanent: "Permanently muted",
    "1h": "Muted for 1 hour",
    "8h": "Muted for 8 hours",
    "24h": "Muted for 24 hours",
    "7d": "Muted for 7 days",
    "30d": "Muted for 30 days",
  };
  return labels[duration];
}

/**
 * Get remaining mute time in hours.
 */
export function getRemainingMuteHours(muted: MutedThread): number {
  if (!muted.expiresAt) return Infinity;
  const remaining = new Date(muted.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60)));
}

/**
 * Check if mute is permanent.
 */
export function isPermanentMute(muted: MutedThread): boolean {
  return muted.expiresAt === null;
}

/**
 * Get mute reason text.
 */
export function getMuteReason(muted: MutedThread): string {
  if (muted.reason) return muted.reason;
  if (isPermanentMute(muted)) return "No reason given";
  return `Auto-unmute in ${getRemainingMuteHours(muted)}h`;
}
