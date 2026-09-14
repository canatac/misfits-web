/**
 * Screen Reader Announcements for Email Selection Changes
 *
 * Provides ARIA live region announcements when:
 * - Email selection changes
 * - Selection is cleared
 * - Bulk actions are performed
 *
 * Pure functions for generating announcement messages; pair with a React
 * component (e.g. <LiveRegion>) that exposes aria-live/role attributes.
 */

export type AnnouncementTone = "assertive" | "polite";

export interface SelectionAnnounceOptions {
  count: number;
  itemLabel?: string;
  tone?: AnnouncementTone;
}

export function announceSelectionChange(opts: SelectionAnnounceOptions): string {
  const { count, itemLabel } = opts;
  if (count === 0) return "Selection cleared.";
  if (count === 1 && itemLabel) return `${itemLabel} selected.`;
  return `${count} items selected.`;
}

export function announceSelectionCleared(): string {
  return "All items deselected.";
}

export function announceSelectAll(total: number): string {
  return `All ${total} items selected.`;
}

export function announceDeselectAll(): string {
  return "All items deselected.";
}

export function announceToggleResult(selected: boolean, label?: string): string {
  if (selected) return label ? `${label} selected.` : "Item selected.";
  return label ? `${label} deselected.` : "Item deselected.";
}

export function getLiveRegionProps(
  tone: AnnouncementTone = "polite",
): Record<string, string | boolean> {
  return {
    "aria-live": tone,
    "aria-atomic": true,
    role: tone === "assertive" ? "alert" : "status",
  };
}
