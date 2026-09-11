/**
 * Persist last-selected filter tab (Issue #416).
 *
 * Remembers the active filter tab across page reloads
 * with localStorage persistence.
 */

export type FilterTab = "all" | "unread" | "attachments" | "starred";

export interface FilterTabState {
  activeTab: FilterTab;
  hasIndicator: boolean;
}

export const STORAGE_KEY = "misfits_filter_tab";
export const DEFAULT_TAB: FilterTab = "all";

/**
 * Get all valid filter tabs.
 */
export function getFilterTabs(): FilterTab[] {
  return ["all", "unread", "attachments", "starred"];
}

/**
 * Check if tab is valid.
 */
export function isValidFilterTab(tab: string): tab is FilterTab {
  return getFilterTabs().includes(tab as FilterTab);
}

/**
 * Load saved filter tab from localStorage.
 */
export function loadFilterTab(): FilterTab {
  if (typeof window === "undefined") return DEFAULT_TAB;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isValidFilterTab(stored)) {
    return stored;
  }
  return DEFAULT_TAB;
}

/**
 * Save filter tab to localStorage.
 */
export function saveFilterTab(tab: FilterTab): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, tab);
}

/**
 * Clear saved filter tab.
 */
export function clearFilterTab(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if tab should show indicator dot.
 */
export function shouldShowIndicator(savedTab: FilterTab | null, currentTab: FilterTab): boolean {
  return savedTab !== null && currentTab !== DEFAULT_TAB;
}

/**
 * Get tab label.
 */
export function getTabLabel(tab: FilterTab): string {
  switch (tab) {
    case "all": return "Focus";
    case "unread": return "Non lus";
    case "attachments": return "Pièces jointes";
    case "starred": return "Favoris";
    default: return tab;
  }
}
