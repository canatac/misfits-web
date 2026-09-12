/**
 * Custom keyboard shortcuts utilities.
 *
 * `normalizeKeyEvent` builds a canonical string representation of a
 * keyboard event, `matchesShortcut` checks an event against a shortcut
 * definition, `registerShortcut` stores a handler keyed by the shortcut,
 * `getActiveShortcuts` returns all registered bindings, and
 * `unregisterShortcut` removes one. Designed to be consumed by a hook or
 * component that listens for keydown events.
 */

export interface ShortcutDefinition {
  /** e.g. "ctrl+shift+p", "escape", "ctrl+k ctrl+b" */
  combo: string;
  handler: (event: KeyboardEvent) => void;
  /** When true, shortcut fires even in input/textarea/contenteditable */
  allowInInput?: boolean;
  id?: string;
}

const REGISTERED = new Map<string, ShortcutDefinition>();

/** Modifier order for canonical combo strings. */
const MODIFIER_ORDER = ["ctrl", "alt", "shift", "meta"];

/** Map of browser event.key values to canonical modifier names. */
const KEY_ALIASES: Record<string, string> = {
  Control: "ctrl",
  Alt: "alt",
  Shift: "shift",
  Meta: "meta",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  " ": "space",
  Escape: "esc",
  Enter: "enter",
  Backspace: "backspace",
  Delete: "delete",
  Tab: "tab",
};

/**
 * Produce a canonical combo string from a KeyboardEvent.
 * Modifiers are always ordered: ctrl+alt+shift+meta+key.
 */
export function normalizeKeyEvent(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  if (event.metaKey) parts.push("meta");

  const keyRaw = event.key;
  const key = KEY_ALIASES[keyRaw] ?? keyRaw.toLowerCase();
  if (!MODIFIER_ORDER.includes(key)) {
    parts.push(key);
  }
  return parts.join("+");
}

/**
 * Check if a KeyboardEvent matches a combo string.
 */
export function matchesShortcut(event: KeyboardEvent, combo: string): boolean {
  return normalizeKeyEvent(event) === combo.toLowerCase();
}

/**
 * Register a shortcut handler. Replaces any existing registration for
 * the same combo.
 */
export function registerShortcut(shortcut: ShortcutDefinition): void {
  const key = shortcut.combo.toLowerCase();
  REGISTERED.set(key, shortcut);
}

/**
 * Unregister a shortcut by its combo string.
 */
export function unregisterShortcut(combo: string): void {
  REGISTERED.delete(combo.toLowerCase());
}

/**
 * Return all registered shortcuts.
 */
export function getActiveShortcuts(): ShortcutDefinition[] {
  return Array.from(REGISTERED.values());
}

/**
 * Find and invoke the matching registered shortcut for a keyboard event.
 * Returns true if a handler was invoked.
 */
export function dispatchShortcut(event: KeyboardEvent): boolean {
  const combo = normalizeKeyEvent(event);
  const shortcut = REGISTERED.get(combo);
  if (!shortcut) return false;

  const target = event.target as HTMLElement | null;
  const inInput =
    target?.tagName === "INPUT" ||
    target?.tagName === "TEXTAREA" ||
    target?.isContentEditable;

  if (inInput && !shortcut.allowInInput) return false;
  shortcut.handler(event);
  return true;
}

/**
 * Clear all registered shortcuts.
 */
export function clearShortcuts(): void {
  REGISTERED.clear();
}
