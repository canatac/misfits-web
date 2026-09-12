/**
 * Prefetch on arrow-key navigation utilities.
 *
 * `registerArrowNavPrefetch` tracks a list of email IDs and prefetch
 * callbacks, `navigateWithPrefetch` calls the appropriate prefetch for
 * the next/previous entry and returns the new active ID, and
 * `unregisterArrowNavPrefetch` clears the prefetch state. Designed to
 * support j/k or arrow-key navigation with anticipatory loading.
 */

export interface ArrowNavPrefetchState {
  emailIds: string[];
  prefetchFn: (emailId: string) => void;
  currentIndex: number;
}

let activeState: ArrowNavPrefetchState | null = null;

/**
 * Register the email list and prefetch function for arrow navigation.
 */
export function registerArrowNavPrefetch(
  emailIds: string[],
  prefetchFn: (emailId: string) => void,
  initialIndex = 0,
): void {
  activeState = { emailIds, prefetchFn, currentIndex: initialIndex };
}

/**
 * Clear the current arrow-nav prefetch state.
 */
export function unregisterArrowNavPrefetch(): void {
  activeState = null;
}

/**
 * Navigate down (next) with prefetch of the email two positions ahead.
 * Returns the new active email ID, or null if not registered.
 */
export function navigateDown(): string | null {
  if (!activeState) return null;
  const { emailIds, prefetchFn, currentIndex } = activeState;
  if (emailIds.length === 0) return null;
  const nextIndex = Math.min(currentIndex + 1, emailIds.length - 1);
  activeState.currentIndex = nextIndex;
  // Prefetch the one after next for smooth scrolling
  const prefetchIndex = Math.min(nextIndex + 1, emailIds.length - 1);
  if (prefetchIndex !== nextIndex) {
    prefetchFn(emailIds[prefetchIndex]);
  }
  return emailIds[nextIndex];
}

/**
 * Navigate up (previous) with prefetch of the email two positions back.
 * Returns the new active email ID, or null if not registered.
 */
export function navigateUp(): string | null {
  if (!activeState) return null;
  const { emailIds, prefetchFn, currentIndex } = activeState;
  if (emailIds.length === 0) return null;
  const nextIndex = Math.max(currentIndex - 1, 0);
  activeState.currentIndex = nextIndex;
  const prefetchIndex = Math.max(nextIndex - 1, 0);
  if (prefetchIndex !== nextIndex) {
    prefetchFn(emailIds[prefetchIndex]);
  }
  return emailIds[nextIndex];
}

/**
 * Handle a keyboard event for arrow navigation (j/k or ArrowDown/ArrowUp).
 * Returns the new active email ID, or null if the event was not a nav key.
 */
export function handleArrowKeyNav(event: KeyboardEvent): string | null {
  switch (event.key) {
    case "j":
    case "ArrowDown":
      return navigateDown();
    case "k":
    case "ArrowUp":
      return navigateUp();
    default:
      return null;
  }
}

/**
 * Get the current active index.
 */
export function getCurrentIndex(): number {
  return activeState?.currentIndex ?? -1;
}

/**
 * Get the current active email ID.
 */
export function getCurrentEmailId(): string | null {
  if (!activeState) return null;
  return activeState.emailIds[activeState.currentIndex] ?? null;
}
