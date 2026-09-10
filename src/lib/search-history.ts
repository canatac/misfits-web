/**
 * Search history with one-click re-run (Issue #433).
 *
 * Stores last 10 unique search queries in localStorage
 * with timestamps and result counts.
 */

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
  resultCount: number;
}

export interface SearchHistory {
  entries: SearchHistoryEntry[];
  maxSize: number;
}

export const STORAGE_KEY = "misfits_search_history";
export const DEFAULT_MAX_SIZE = 10;

/**
 * Create search history.
 */
export function createSearchHistory(maxSize: number = DEFAULT_MAX_SIZE): SearchHistory {
  return { entries: [], maxSize };
}

/**
 * Add search query to history (FIFO eviction).
 */
export function addSearchQuery(
  history: SearchHistory,
  query: string,
  resultCount: number = 0
): SearchHistory {
  const trimmed = query.trim();
  if (!trimmed) return history;

  // Remove duplicate if exists
  const filtered = history.entries.filter((e) => e.query !== trimmed);

  const newEntries: SearchHistoryEntry[] = [
    { query: trimmed, timestamp: Date.now(), resultCount },
    ...filtered,
  ];

  // FIFO eviction
  while (newEntries.length > history.maxSize) {
    newEntries.pop();
  }

  return { ...history, entries: newEntries };
}

/**
 * Remove specific query from history.
 */
export function removeSearchQuery(history: SearchHistory, query: string): SearchHistory {
  return {
    ...history,
    entries: history.entries.filter((e) => e.query !== query),
  };
}

/**
 * Clear all search history.
 */
export function clearSearchHistory(history: SearchHistory): SearchHistory {
  return { ...history, entries: [] };
}

/**
 * Get recent searches (sorted by timestamp desc).
 */
export function getRecentSearches(history: SearchHistory): SearchHistoryEntry[] {
  return [...history.entries].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get search history size.
 */
export function getHistorySize(history: SearchHistory): number {
  return history.entries.length;
}

/**
 * Check if history is empty.
 */
export function isHistoryEmpty(history: SearchHistory): boolean {
  return history.entries.length === 0;
}

/**
 * Check if query exists in history.
 */
export function hasQuery(history: SearchHistory, query: string): boolean {
  return history.entries.some((e) => e.query === query.trim());
}

/**
 * Load search history from localStorage.
 */
export function loadSearchHistory(maxSize: number = DEFAULT_MAX_SIZE): SearchHistory {
  if (typeof window === "undefined") return createSearchHistory(maxSize);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { entries: parsed.entries ?? [], maxSize };
    } catch {
      return createSearchHistory(maxSize);
    }
  }
  return createSearchHistory(maxSize);
}

/**
 * Save search history to localStorage.
 */
export function saveSearchHistory(history: SearchHistory): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: history.entries }));
}

/**
 * Format timestamp for display.
 */
export function formatTimestamp(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
