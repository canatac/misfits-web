/**
 * Undo send utility (Issue #518).
 *
 * Provides a 5-second recall window after sending an email.
 * Manages the countdown, cancellation, and draft restoration.
 */

export interface UndoSendState {
  emailId: string;
  sentAt: string;
  expiresAt: string;
  isCancelled: boolean;
  isExpired: boolean;
  remainingSeconds: number;
}

export interface UndoSendResult {
  success: boolean;
  emailId: string;
  restoredToDrafts: boolean;
  message: string;
}

const UNDO_WINDOW_MS = 5000; // 5 seconds

/**
 * Create a new undo send state.
 */
export function createUndoSendState(emailId: string): UndoSendState {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + UNDO_WINDOW_MS);

  return {
    emailId,
    sentAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isCancelled: false,
    isExpired: false,
    remainingSeconds: 5,
  };
}

/**
 * Get the remaining time in milliseconds.
 */
export function getRemainingMs(state: UndoSendState): number {
  const expiresAt = new Date(state.expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, expiresAt - now);
}

/**
 * Get the remaining seconds (rounded up).
 */
export function getRemainingSeconds(state: UndoSendState): number {
  return Math.ceil(getRemainingMs(state) / 1000);
}

/**
 * Check if the undo window is still active.
 */
export function isUndoWindowActive(state: UndoSendState): boolean {
  return getRemainingMs(state) > 0 && !state.isCancelled;
}

/**
 * Check if the undo window has expired.
 */
export function isUndoWindowExpired(state: UndoSendState): boolean {
  return getRemainingMs(state) <= 0;
}

/**
 * Cancel the send (within the undo window).
 */
export function cancelSend(state: UndoSendState): UndoSendResult {
  if (isUndoWindowExpired(state)) {
    return {
      success: false,
      emailId: state.emailId,
      restoredToDrafts: false,
      message: "Undo window has expired",
    };
  }

  if (state.isCancelled) {
    return {
      success: false,
      emailId: state.emailId,
      restoredToDrafts: false,
      message: "Send already cancelled",
    };
  }

  return {
    success: true,
    emailId: state.emailId,
    restoredToDrafts: true,
    message: "Send cancelled, email restored to drafts",
  };
}

/**
 * Get the undo window duration in milliseconds.
 */
export function getUndoWindowMs(): number {
  return UNDO_WINDOW_MS;
}

/**
 * Get the undo window duration in seconds.
 */
export function getUndoWindowSeconds(): number {
  return UNDO_WINDOW_MS / 1000;
}

/**
 * Format the remaining time as a display string.
 */
export function formatRemainingTime(state: UndoSendState): string {
  const seconds = getRemainingSeconds(state);
  return `${seconds}s`;
}

/**
 * Create a countdown callback that fires every second.
 */
export function createCountdown(
  state: UndoSendState,
  onTick: (remainingSeconds: number) => void,
  onExpire: () => void
): () => void {
  const interval = setInterval(() => {
    const remaining = getRemainingSeconds(state);
    onTick(remaining);

    if (remaining <= 0) {
      clearInterval(interval);
      onExpire();
    }
  }, 1000);

  // Return cleanup function
  return () => clearInterval(interval);
}
