/**
 * Email pinning (Issue #459).
 *
 * Pin important emails to top of inbox with FIFO eviction (max 10).
 */

export interface PinnedEmail {
  emailId: string;
  pinnedAt: string;
}

export interface PinState {
  pinned: PinnedEmail[];
  maxPins: number;
}

export const DEFAULT_MAX_PINS = 10;

/**
 * Create initial pin state.
 */
export function createPinState(maxPins: number = DEFAULT_MAX_PINS): PinState {
  return { pinned: [], maxPins };
}

/**
 * Check if email is pinned.
 */
export function isPinned(state: PinState, emailId: string): boolean {
  return state.pinned.some((p) => p.emailId === emailId);
}

/**
 * Pin an email (FIFO eviction if max reached).
 */
export function pinEmail(state: PinState, emailId: string): PinState {
  if (isPinned(state, emailId)) return state;

  const newPinned = [...state.pinned, { emailId, pinnedAt: new Date().toISOString() }];

  // FIFO eviction
  while (newPinned.length > state.maxPins) {
    newPinned.shift();
  }

  return { ...state, pinned: newPinned };
}

/**
 * Unpin an email.
 */
export function unpinEmail(state: PinState, emailId: string): PinState {
  return { ...state, pinned: state.pinned.filter((p) => p.emailId !== emailId) };
}

/**
 * Toggle pin state.
 */
export function togglePin(state: PinState, emailId: string): PinState {
  return isPinned(state, emailId) ? unpinEmail(state, emailId) : pinEmail(state, emailId);
}

/**
 * Get pinned emails in order (most recent last).
 */
export function getPinnedEmails(state: PinState): string[] {
  return state.pinned.map((p) => p.emailId);
}

/**
 * Get pin count.
 */
export function getPinCount(state: PinState): number {
  return state.pinned.length;
}

/**
 * Check if max pins reached.
 */
export function isMaxPinsReached(state: PinState): boolean {
  return state.pinned.length >= state.maxPins;
}
