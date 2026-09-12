/**
 * column-customization.ts — list column customization persistence.
 *
 * Defines available columns, their default visibility order, and helpers to
 * load/save column preferences via localStorage with a typed schema.
 */

export interface ColumnDef {
  id: string;
  label: string;
  defaultVisible: boolean;
  order: number;
  width?: number;
}

export interface ColumnPreferences {
  visibleIds: string[];
  widths: Record<string, number>;
}

const STORAGE_KEY = "misfits.columnPrefs";

export const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: "from", label: "From", defaultVisible: true, order: 0, width: 180 },
  { id: "subject", label: "Subject", defaultVisible: true, order: 1, width: 320 },
  { id: "attachment", label: "Attachment", defaultVisible: true, order: 2, width: 40 },
  { id: "date", label: "Date", defaultVisible: true, order: 3, width: 90 },
  { id: "label", label: "Label", defaultVisible: false, order: 4, width: 120 },
];

export function defaultPreferences(): ColumnPreferences {
  return {
    visibleIds: DEFAULT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id),
    widths: Object.fromEntries(DEFAULT_COLUMNS.map((c) => [c.id, c.width ?? 100])),
  };
}

/** Merge saved prefs with defaults; drops unknown column ids. */
export function normalizePrefs(saved: ColumnPreferences): ColumnPreferences {
  const known = new Set(DEFAULT_COLUMNS.map((c) => c.id));
  const visibleIds = saved.visibleIds.filter((id) => known.has(id));
  const widths: Record<string, number> = {};
  for (const id of known) {
    widths[id] = saved.widths[id] ?? DEFAULT_COLUMNS.find((c) => c.id === id)?.width ?? 100;
  }
  return { visibleIds, widths };
}

export function loadPreferences(): ColumnPreferences {
  if (typeof localStorage === "undefined") return defaultPreferences();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultPreferences();
  try {
    return normalizePrefs(JSON.parse(raw));
  } catch {
    return defaultPreferences();
  }
}

export function savePreferences(prefs: ColumnPreferences): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function resetPreferences(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
