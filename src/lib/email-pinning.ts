/**
 * email-pinning.ts — email pinning/unpinning utilities for misfits.ai Mail.
 *
 * Pinned emails stay at the top of the inbox regardless of sort order.
 * Uses localStorage for persistence.
 */
import type { Email } from "@/types/email";

export const PINNED_KEY = "misfits:pinned-emails";
export const PINNED_CHANNEL = "misfits-pinned";

export type PinnedMap = Record<string, string>; // emailId -> pinnedAt ISO

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

function safeStorage(): Storage | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    return w.localStorage;
  } catch {
    return null;
  }
}

export function loadPinned(): PinnedMap {
  const storage = safeStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(PINNED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed;
    return {};
  } catch {
    return {};
  }
}

export function savePinned(map: PinnedMap): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(PINNED_KEY, JSON.stringify(map));
  const w = safeWindow();
  if (w && typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel(PINNED_CHANNEL);
      channel.postMessage({ type: "pinned-updated", ts: Date.now() });
      channel.close();
    } catch {
      // ignore
    }
  }
}

export function pinEmail(emailId: string): PinnedMap {
  const map = loadPinned();
  map[emailId] = new Date().toISOString();
  savePinned(map);
  return map;
}

export function unpinEmail(emailId: string): PinnedMap {
  const map = loadPinned();
  delete map[emailId];
  savePinned(map);
  return map;
}

export function isPinned(emailId: string): boolean {
  return Object.prototype.hasOwnProperty.call(loadPinned(), emailId);
}

export function togglePin(emailId: string): { pinned: boolean; map: PinnedMap } {
  const map = loadPinned();
  if (Object.prototype.hasOwnProperty.call(map, emailId)) {
    delete map[emailId];
    savePinned(map);
    return { pinned: false, map };
  }
  map[emailId] = new Date().toISOString();
  savePinned(map);
  return { pinned: true, map };
}

export function onPinnedUpdated(listener: () => void): () => void {
  const w = safeWindow();
  if (!w || typeof BroadcastChannel === "undefined") return () => {};
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(PINNED_CHANNEL);
    channel.addEventListener("message", listener);
  } catch {
    return () => {};
  }
  return () => {
    channel?.removeEventListener("message", listener);
    channel?.close();
  };
}

/** Sort helper: pinned emails first, then by date descending. */
export function sortByPinned<T extends { id: string; date: string }>(
  items: T[]
): T[] {
  const pinned = loadPinned();
  return items
    .slice()
    .sort((a, b) => {
      const aPinned = Object.prototype.hasOwnProperty.call(pinned, a.id) ? 1 : 0;
      const bPinned = Object.prototype.hasOwnProperty.call(pinned, b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}
