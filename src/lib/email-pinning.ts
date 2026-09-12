/**
 * Email pinning utilities.
 *
 * `pinEmail` adds an email to the pinned set, `unpinEmail` removes it,
 * `isEmailPinned` checks pinning status, `getPinnedEmails` returns the
 * ordered list of pinned IDs, and `reorderPinned` moves an entry within
 * the ordering. State is persisted to localStorage so pins survive
 * reloads.
 */

const STORAGE_KEY = "misfits:pinned-emails";
const MAX_PINNED = 50;

function loadPinned(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function savePinned(pinned: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned));
}

/**
 * Pin an email by its ID. Returns the new pinned list.
 * No-op if already pinned. Caps at MAX_PINNED (oldest dropped).
 */
export function pinEmail(emailId: string, pinned: string[] = loadPinned()): string[] {
  if (!emailId || pinned.includes(emailId)) return pinned;
  const next = [...pinned, emailId];
  if (next.length > MAX_PINNED) next.shift();
  savePinned(next);
  return next;
}

/**
 * Unpin an email by its ID. Returns the new pinned list.
 * No-op if not pinned.
 */
export function unpinEmail(emailId: string, pinned: string[] = loadPinned()): string[] {
  if (!emailId) return pinned;
  const next = pinned.filter((id) => id !== emailId);
  savePinned(next);
  return next;
}

/**
 * Toggle pin status. Returns the new pinned list.
 */
export function togglePin(emailId: string, pinned: string[] = loadPinned()): string[] {
  if (isEmailPinned(emailId, pinned)) return unpinEmail(emailId, pinned);
  return pinEmail(emailId, pinned);
}

/**
 * Check whether an email is currently pinned.
 */
export function isEmailPinned(emailId: string, pinned: string[] = loadPinned()): boolean {
  return pinned.includes(emailId);
}

/**
 * Return the ordered list of pinned email IDs.
 */
export function getPinnedEmails(): string[] {
  return loadPinned();
}

/**
 * Reorder a pinned email from one index to another.
 * Returns the new pinned list.
 */
export function reorderPinned(fromIndex: number, toIndex: number, pinned: string[] = loadPinned()): string[] {
  if (
    fromIndex < 0 || toIndex < 0 ||
    fromIndex >= pinned.length || toIndex >= pinned.length ||
    fromIndex === toIndex
  ) {
    return pinned;
  }
  const next = [...pinned];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  savePinned(next);
  return next;
}

/**
 * Clear all pinned emails.
 */
export function clearAllPins(): void {
  localStorage.removeItem(STORAGE_KEY);
}
