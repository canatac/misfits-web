/* Custom keyboard shortcuts utilities.
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
 * custom-keyboard-shortcuts.ts - customizable keyboard shortcuts for misfits.ai Mail.
 */
export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
};

export type ShortcutAction = string;
export type ShortcutMap = Record<ShortcutAction, KeyboardShortcut>;

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  compose: { key: "c", description: "Compose new email" },
  reply: { key: "r", description: "Reply to email" },
  replyAll: { key: "a", meta: true, shift: true, description: "Reply all" },
  archive: { key: "e", description: "Archive email" },
  delete: { key: "#", shift: true, description: "Delete email" },
  pin: { key: "p", description: "Pin/unpin email" },
  search: { key: "/", description: "Focus search" },
  nextEmail: { key: "j", description: "Next email" },
  prevEmail: { key: "k", description: "Previous email" },
  send: { key: "Enter", meta: true, description: "Send email" },
  snooze: { key: "h", description: "Snooze email" },
  undo: { key: "z", meta: true, description: "Undo last action" },
  markRead: { key: "i", description: "Mark as read" },
  markUnread: { key: "u", description: "Mark as unread" },
  openThread: { key: "o", description: "Open selected thread" },
  closeThread: { key: "Escape", description: "Close thread detail" },
};

export const SHORTCUTS_STORAGE_KEY = "misfits:custom-shortcuts";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadCustomShortcuts(): Partial<ShortcutMap> {
  const storage = safeStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(SHORTCUTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCustomShortcuts(overrides: Partial<ShortcutMap>): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(overrides));
}

export function getEffectiveShortcuts(): ShortcutMap {
  const overrides = loadCustomShortcuts();
  const result = { ...DEFAULT_SHORTCUTS };
  for (const [key, value] of Object.entries(overrides)) {
    if (value) result[key as ShortcutAction] = value;
  }
  return result;
}

export function setShortcutOverride(
  action: ShortcutAction,
  shortcut: KeyboardShortcut
): void {
  const overrides = loadCustomShortcuts();
  overrides[action] = shortcut;
  saveCustomShortcuts(overrides);
}

export function resetShortcut(action: ShortcutAction): void {
  const overrides = loadCustomShortcuts();
  delete overrides[action];
  saveCustomShortcuts(overrides);
}

export function resetAllShortcuts(): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(SHORTCUTS_STORAGE_KEY);
}

export function serializeShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.meta) parts.push("Meta");
  parts.push(shortcut.key === " " ? "Space" : shortcut.key);
  return parts.join("+");
}

export function findActionForKey(
  key: string,
  modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  } = {}
): ShortcutAction | null {
  const map = getEffectiveShortcuts();
  for (const [action, shortcut] of Object.entries(map)) {
    if (
      shortcut.key === key &&
      !!shortcut.ctrl === !!modifiers.ctrl &&
      !!shortcut.shift === !!modifiers.shift &&
      !!shortcut.alt === !!modifiers.alt &&
      !!shortcut.meta === !!modifiers.meta
    ) {
      return action;
    }
  }
  return null;
}

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
