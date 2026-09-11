/**
 * Skip-to-search keyboard shortcut (Issue #449).
 *
 * Press '/' to focus search input from anywhere on the mail page.
 * Escape clears focus and returns to list.
 */

export interface SkipSearchConfig {
  shortcutKey: string;
  escapeKey: string;
  placeholderHint: string;
}

export const DEFAULT_CONFIG: SkipSearchConfig = {
  shortcutKey: "/",
  escapeKey: "Escape",
  placeholderHint: "Search... (press /)",
};

export interface SkipSearchState {
  searchFocused: boolean;
  placeholder: string;
}

/**
 * Create initial skip search state.
 */
export function createSkipSearchState(config: SkipSearchConfig = DEFAULT_CONFIG): SkipSearchState {
  return { searchFocused: false, placeholder: config.placeholderHint };
}

/**
 * Check if event target is an input element.
 */
export function isInputFocused(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  if (!target) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

/**
 * Check if modifier key is pressed.
 */
export function hasModifierKey(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

/**
 * Check if skip search should trigger.
 */
export function shouldTriggerSkipSearch(
  event: KeyboardEvent,
  config: SkipSearchConfig = DEFAULT_CONFIG
): boolean {
  return (
    event.key === config.shortcutKey &&
    !hasModifierKey(event) &&
    !isInputFocused(event)
  );
}

/**
 * Check if escape should clear search.
 */
export function shouldClearSearch(
  event: KeyboardEvent,
  config: SkipSearchConfig = DEFAULT_CONFIG
): boolean {
  return event.key === config.escapeKey;
}

/**
 * Focus search input.
 */
export function focusSearchInput(): boolean {
  const searchInput = document.querySelector<HTMLInputElement>(
    'input[type="search"], input[aria-label="Search"], input[placeholder*="Search"]'
  );
  if (searchInput) {
    searchInput.focus();
    return true;
  }
  return false;
}

/**
 * Blur search input.
 */
export function blurSearchInput(): boolean {
  const searchInput = document.querySelector<HTMLInputElement>(
    'input[type="search"], input[aria-label="Search"], input[placeholder*="Search"]'
  );
  if (searchInput && document.activeElement === searchInput) {
    searchInput.blur();
    return true;
  }
  return false;
}

/**
 * Handle keyboard event for skip search.
 */
export function handleSkipSearch(
  event: KeyboardEvent,
  config: SkipSearchConfig = DEFAULT_CONFIG
): "focused" | "blurred" | null {
  if (shouldTriggerSkipSearch(event, config)) {
    event.preventDefault();
    if (focusSearchInput()) return "focused";
  } else if (shouldClearSearch(event, config)) {
    if (blurSearchInput()) return "blurred";
  }
  return null;
}
