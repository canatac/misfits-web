/**
 * mute-thread.ts — thread mute toggle helpers.
 *
 * Tracks muted threads with expiry. Muting suppresses notifications until
 * the mute period expires (or the user unmutes manually).
 */

export interface MuteRecord {
  threadId: string;
  mutedAt: number;
  expiresAt: number | null; // null = permanent
}

export interface MuteOptions {
  /** Duration in ms. Omit or pass null for permanent mute. */
  durationMs?: number | null;
}

const STORAGE_KEY = "mismutes";

export function muteThread(threadId: string, opts: MuteOptions = {}): MuteRecord {
  const now = Date.now();
  const duration = opts.durationMs ?? null;
  return {
    threadId,
    mutedAt: now,
    expiresAt: duration ? now + duration : null,
  };
}

export function unmuteThread(record: MuteRecord): MuteRecord {
  return { ...record, expiresAt: 0 }; // already-expired
}

export function isMuted(record: MuteRecord, now: number = Date.now()): boolean {
  if (record.expiresAt === null) return true; // permanent
  return now < record.expiresAt;
}

/** Persist mute records to localStorage. */
export function saveMuteRecords(records: MuteRecord[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadMuteRecords(): MuteRecord[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MuteRecord[];
  } catch {
    return [];
  }
}

/** Toggle mute on a thread: adds or removes the mute record. */
export function toggleMute(threadId: string, records: MuteRecord[]): MuteRecord[] {
  const exists = records.find((r) => r.threadId === threadId);
  if (exists) return records.filter((r) => r.threadId !== threadId);
  return [...records, muteThread(threadId)];
}
