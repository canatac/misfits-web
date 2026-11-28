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

/**
 * A shortcut a preset had to take from another action to avoid a conflict.
 * Reported to the caller so the resolution is never silent (#1199).
 */
export interface PresetConflict {
  shortcut: string;
  presetAction: string;
  presetLabel: string;
  displacedAction: string;
  displacedLabel: string;
  displacedShortcut: string | null;
  message: string;
}

export interface ApplyPresetResult {
  state: ShortcutState;
  conflicts: PresetConflict[];
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
 * Apply a preset and report every conflict it had to resolve (#1199).
 *
 * The bindings of the actions a preset redefines are replaced, so an action
 * never keeps two shortcuts. When the preset gives a shortcut another action
 * already uses, the preset wins and the displaced action is moved to the
 * shortcut the preset action gave up, so each action keeps exactly one
 * shortcut and no shortcut is bound to two actions. Every such resolution is
 * returned in `conflicts` with a readable message, never applied silently.
 */
export function applyPresetWithReport(
  state: ShortcutState,
  presetId: string
): ApplyPresetResult {
  const preset = state.presets.find((p) => p.id === presetId);
  if (!preset) return { state, conflicts: [] };

  // A preset lists full bindings; the last entry for an action is the one that
  // applies, so a redefined action never keeps its previous shortcut twice.
  const desired = new Map<string, ShortcutBinding>();
  for (const binding of preset.bindings) {
    desired.set(binding.action, binding);
  }

  const previousShortcutByAction = new Map(
    state.bindings.map((b) => [b.action, b.shortcut])
  );
  const bindingsByAction = new Map<string, ShortcutBinding>();
  const actionByShortcut = new Map<string, string>();
  const conflicts: PresetConflict[] = [];

  for (const binding of desired.values()) {
    const occupant = actionByShortcut.get(binding.shortcut);
    if (occupant === undefined) {
      bindingsByAction.set(binding.action, binding);
      actionByShortcut.set(binding.shortcut, binding.action);
      continue;
    }
    if (occupant === binding.action) continue;

    const displaced = bindingsByAction.get(occupant);
    if (!displaced) continue;

    const fallback = previousShortcutByAction.get(binding.action);
    const displacedShortcut =
      fallback && fallback !== binding.shortcut && !actionByShortcut.has(fallback)
        ? fallback
        : null;

    bindingsByAction.set(binding.action, binding);
    actionByShortcut.set(binding.shortcut, binding.action);
    bindingsByAction.set(
      displaced.action,
      displacedShortcut ? { ...displaced, shortcut: displacedShortcut } : { ...displaced, shortcut: "" }
    );
    if (displacedShortcut) {
      actionByShortcut.set(displacedShortcut, displaced.action);
    }

    conflicts.push({
      shortcut: binding.shortcut,
      presetAction: binding.action,
      presetLabel: binding.label,
      displacedAction: displaced.action,
      displacedLabel: displaced.label,
      displacedShortcut,
      message:
        `"${binding.label}" takes "${binding.shortcut}" from "${displaced.label}"` +
        (displacedShortcut
          ? `, which is moved to "${displacedShortcut}".`
          : ", which keeps no shortcut."),
    });
  }

  return {
    state: {
      ...state,
      bindings: [...bindingsByAction.values()],
      activePreset: presetId,
    },
    conflicts,
  };
}

/**
 * Apply a preset.
 */
export function applyPreset(state: ShortcutState, presetId: string): ShortcutState {
  return applyPresetWithReport(state, presetId).state;
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
