/**
 * Persist thread expansion state (Issue #417).
 *
 * Remembers which threads were expanded across navigation
 * with localStorage persistence and 7-day auto-prune.
 */

export interface ThreadExpansionEntry {
  threadId: string;
  expandedAt: number;
  folder: string;
}

export interface ThreadExpansionState {
  entries: ThreadExpansionEntry[];
}

export const STORAGE_KEY = "misfits_expanded_threads";
export const EXPIRY_DAYS = 7;
export const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Create empty state.
 */
export function createThreadExpansionState(): ThreadExpansionState {
  return { entries: [] };
}

/**
 * Mark thread as expanded.
 */
export function expandThread(state: ThreadExpansionState, threadId: string, folder: string): ThreadExpansionState {
  const filtered = state.entries.filter((e) => !(e.threadId === threadId && e.folder === folder));
  return {
    entries: [...filtered, { threadId, expandedAt: Date.now(), folder }],
  };
}

/**
 * Mark thread as collapsed.
 */
export function collapseThread(state: ThreadExpansionState, threadId: string, folder: string): ThreadExpansionState {
  return {
    entries: state.entries.filter((e) => !(e.threadId === threadId && e.folder === folder)),
  };
}

/**
 * Check if thread is expanded.
 */
export function isThreadExpanded(state: ThreadExpansionState, threadId: string, folder: string): boolean {
  return state.entries.some((e) => e.threadId === threadId && e.folder === folder);
}

/**
 * Prune expired entries (>7 days).
 */
export function pruneExpired(state: ThreadExpansionState): ThreadExpansionState {
  const cutoff = Date.now() - EXPIRY_MS;
  return {
    entries: state.entries.filter((e) => e.expandedAt > cutoff),
  };
}

/**
 * Get expanded thread IDs for folder.
 */
export function getExpandedForFolder(state: ThreadExpansionState, folder: string): string[] {
  return state.entries.filter((e) => e.folder === folder).map((e) => e.threadId);
}

/**
 * Load state from localStorage.
 */
export function loadThreadExpansion(): ThreadExpansionState {
  if (typeof window === "undefined") return createThreadExpansionState();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const state: ThreadExpansionState = { entries: parsed.entries ?? [] };
      return pruneExpired(state);
    } catch {
      return createThreadExpansionState();
    }
  }
  return createThreadExpansionState();
}

/**
 * Save state to localStorage.
 */
export function saveThreadExpansion(state: ThreadExpansionState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: state.entries }));
}
