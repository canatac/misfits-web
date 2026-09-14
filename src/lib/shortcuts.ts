/**
 * Custom keyboard shortcut settings (Issue #461).
 *
 * User-defined keyboard shortcuts with conflict detection,
 * presets, and import/export functionality.
 */

export interface ShortcutBinding {
  action: string;
  label: string;
  shortcut: string;
  category: string;
}

export interface ShortcutPreset {
  id: string;
  name: string;
  description: string;
  bindings: ShortcutBinding[];
}

export interface ShortcutState {
  bindings: ShortcutBinding[];
  presets: ShortcutPreset[];
  activePreset: string;
}

export const DEFAULT_BINDINGS: ShortcutBinding[] = [
  { action: "compose", label: "Compose new email", shortcut: "c", category: "Navigation" },
  { action: "reply", label: "Reply to email", shortcut: "r", category: "Actions" },
  { action: "archive", label: "Archive email", shortcut: "e", category: "Actions" },
  { action: "delete", label: "Delete email", shortcut: "#", category: "Actions" },
  { action: "star", label: "Star/Pin email", shortcut: "p", category: "Actions" },
  { action: "snooze", label: "Snooze email", shortcut: "s", category: "Actions" },
  { action: "next", label: "Next email", shortcut: "j", category: "Navigation" },
  { action: "previous", label: "Previous email", shortcut: "k", category: "Navigation" },
  { action: "search", label: "Search emails", shortcut: "/", category: "Navigation" },
  { action: "send", label: "Send email", shortcut: "Ctrl+Enter", category: "Compose" },
  { action: "undo", label: "Undo last action", shortcut: "Ctrl+z", category: "Actions" },
  { action: "selectAll", label: "Select all emails", shortcut: "*", category: "Selection" },
];

export const PRESETS: ShortcutPreset[] = [
  {
    id: "default",
    name: "Default",
    description: "Default misfits shortcuts",
    bindings: DEFAULT_BINDINGS,
  },
  {
    id: "gmail",
    name: "Gmail-like",
    description: "Shortcuts similar to Gmail",
    bindings: [
      ...DEFAULT_BINDINGS,
      { action: "reply", label: "Reply to email", shortcut: "a", category: "Actions" },
      { action: "archive", label: "Archive email", shortcut: "y", category: "Actions" },
    ],
  },
  {
    id: "vim",
    name: "Vim-style",
    description: "Vim-inspired shortcuts",
    bindings: [
      ...DEFAULT_BINDINGS,
      { action: "next", label: "Next email", shortcut: "n", category: "Navigation" },
      { action: "previous", label: "Previous email", shortcut: "p", category: "Navigation" },
    ],
  },
];

/**
 * Create initial shortcut state.
 */
export function createShortcutState(): ShortcutState {
  return {
    bindings: [...DEFAULT_BINDINGS],
    presets: PRESETS,
    activePreset: "default",
  };
}

/**
 * Get binding for an action.
 */
export function getBinding(state: ShortcutState, action: string): ShortcutBinding | undefined {
  return state.bindings.find((b) => b.action === action);
}

/**
 * Get binding by shortcut.
 */
export function getBindingByShortcut(state: ShortcutState, shortcut: string): ShortcutBinding | undefined {
  return state.bindings.find((b) => b.shortcut === shortcut);
}

/**
 * Check for shortcut conflicts.
 */
export function findConflicts(state: ShortcutState, shortcut: string, excludeAction?: string): ShortcutBinding[] {
  return state.bindings.filter((b) => b.shortcut === shortcut && b.action !== excludeAction);
}

/**
 * Update a shortcut binding.
 */
export function updateBinding(state: ShortcutState, action: string, newShortcut: string): ShortcutState {
  return {
    ...state,
    bindings: state.bindings.map((b) =>
      b.action === action ? { ...b, shortcut: newShortcut } : b
    ),
  };
}

/**
 * Apply a preset.
 */
export function applyPreset(state: ShortcutState, presetId: string): ShortcutState {
  const preset = state.presets.find((p) => p.id === presetId);
  if (!preset) return state;
  return {
    ...state,
    bindings: [...preset.bindings],
    activePreset: presetId,
  };
}

/**
 * Reset to default bindings.
 */
export function resetToDefault(state: ShortcutState): ShortcutState {
  return applyPreset(state, "default");
}

/**
 * Export bindings as JSON.
 */
export function exportBindings(state: ShortcutState): string {
  return JSON.stringify(state.bindings, null, 2);
}

/**
 * Import bindings from JSON.
 */
export function importBindings(state: ShortcutState, json: string): ShortcutState {
  try {
    const bindings = JSON.parse(json) as ShortcutBinding[];
    return { ...state, bindings };
  } catch {
    return state;
  }
}

/**
 * Validate shortcut (prevent system shortcuts).
 */
export function isValidShortcut(shortcut: string): boolean {
  const forbidden = ["ctrl+w", "ctrl+q", "ctrl+c", "ctrl+v", "ctrl+x"];
  return !forbidden.includes(shortcut.toLowerCase());
}

/**
 * Get all shortcuts for a category.
 */
export function getBindingsByCategory(state: ShortcutState, category: string): ShortcutBinding[] {
  return state.bindings.filter((b) => b.category === category);
}

/**
 * Get all categories.
 */
export function getCategories(state: ShortcutState): string[] {
  return [...new Set(state.bindings.map((b) => b.category))];
}
