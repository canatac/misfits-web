export type AnnouncementTone = "assertive" | "polite";
export interface SelectionAnnounceOptions { count: number; itemLabel?: string; tone?: AnnouncementTone }

export function announceSelectionChange(opts: SelectionAnnounceOptions): string {
  const { count, itemLabel } = opts;
  if (count === 0) return "Selection cleared.";
  if (count === 1 && itemLabel) return `${itemLabel} selected.`;
  return `${count} items selected.`;
}

export function announceSelectionCleared(): string { return "All items deselected."; }
export function announceSelectAll(total: number): string { return `All ${total} items selected.`; }
export function announceDeselectAll(): string { return "All items deselected."; }

export function announceToggleResult(selected: boolean, label?: string): string {
  if (selected) return label ? `${label} selected.` : "Item selected.";
  return label ? `${label} deselected.` : "Item deselected.";
}

export function getLiveRegionProps(tone: AnnouncementTone = "polite"): Record<string, string | boolean> {
  return { "aria-live": tone, "aria-atomic": true, role: tone === "assertive" ? "alert" : "status" };
}
