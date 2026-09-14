/**
 * Email list column customization (Issue #478).
 *
 * Allows users to show/hide columns in the email list view.
 * Persists preferences to localStorage and adapts to mobile.
 */

export type ColumnId = "checkbox" | "avatar" | "sender" | "subject" | "date" | "attachments" | "labels" | "readingTime";

export interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  essential: boolean; // Always shown on mobile
  mobileVisible: boolean;
}

export interface ColumnCustomization {
  columns: ColumnConfig[];
  updatedAt: string;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "checkbox", label: "Checkbox", visible: true, essential: true, mobileVisible: true },
  { id: "avatar", label: "Avatar", visible: true, essential: true, mobileVisible: true },
  { id: "sender", label: "Sender", visible: true, essential: true, mobileVisible: true },
  { id: "subject", label: "Subject", visible: true, essential: true, mobileVisible: true },
  { id: "date", label: "Date", visible: true, essential: true, mobileVisible: true },
  { id: "attachments", label: "Attachments", visible: true, essential: false, mobileVisible: false },
  { id: "labels", label: "Labels", visible: false, essential: false, mobileVisible: false },
  { id: "readingTime", label: "Reading Time", visible: false, essential: false, mobileVisible: false },
];

const STORAGE_KEY = "misfits-email-columns";

/**
 * Get default column configuration.
 */
export function getDefaultColumns(): ColumnConfig[] {
  return DEFAULT_COLUMNS.map((c) => ({ ...c }));
}

/**
 * Load column customization from localStorage.
 */
export function loadColumnCustomization(): ColumnCustomization {
  if (typeof window === "undefined") {
    return { columns: getDefaultColumns(), updatedAt: new Date().toISOString() };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { columns: getDefaultColumns(), updatedAt: new Date().toISOString() };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { columns: getDefaultColumns(), updatedAt: new Date().toISOString() };
  }
}

/**
 * Save column customization to localStorage.
 */
export function saveColumnCustomization(customization: ColumnCustomization): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
}

/**
 * Toggle column visibility.
 */
export function toggleColumn(columns: ColumnConfig[], columnId: string): ColumnConfig[] {
  return columns.map((c) =>
    c.id === columnId ? { ...c, visible: !c.visible } : c
  );
}

/**
 * Reset columns to default.
 */
export function resetColumns(): ColumnConfig[] {
  return getDefaultColumns();
}

/**
 * Get visible columns.
 */
export function getVisibleColumns(columns: ColumnConfig[]): ColumnConfig[] {
  return columns.filter((c) => c.visible);
}

/**
 * Get mobile columns (essential + visible non-essential).
 */
export function getMobileColumns(columns: ColumnConfig[]): ColumnConfig[] {
  return columns.filter((c) => c.essential || (c.mobileVisible && c.visible));
}

/**
 * Check if column is visible.
 */
export function isColumnVisible(columns: ColumnConfig[], columnId: string): boolean {
  const column = columns.find((c) => c.id === columnId);
  return column?.visible ?? false;
}

/**
 * Update column visibility.
 */
export function updateColumnVisibility(
  columns: ColumnConfig[],
  columnId: string,
  visible: boolean
): ColumnConfig[] {
  return columns.map((c) =>
    c.id === columnId ? { ...c, visible } : c
  );
}

/**
 * Get visible column count.
 */
export function getVisibleColumnCount(columns: ColumnConfig[]): number {
  return columns.filter((c) => c.visible).length;
}
