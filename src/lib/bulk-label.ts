/**
 * Bulk label assignment (Issue #429).
 *
 * Apply labels to multiple selected emails with dropdown picker.
 */

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface BulkLabelState {
  isOpen: boolean;
  selectedLabels: Set<string>;
  emailIds: string[];
}

/**
 * Create initial bulk label state.
 */
export function createBulkLabelState(): BulkLabelState {
  return { isOpen: false, selectedLabels: new Set(), emailIds: [] };
}

/**
 * Open bulk label picker.
 */
export function openBulkLabel(state: BulkLabelState, emailIds: string[]): BulkLabelState {
  return { ...state, isOpen: true, emailIds, selectedLabels: new Set() };
}

/**
 * Close bulk label picker.
 */
export function closeBulkLabel(state: BulkLabelState): BulkLabelState {
  return { ...state, isOpen: false, selectedLabels: new Set() };
}

/**
 * Toggle label selection.
 */
export function toggleLabel(state: BulkLabelState, labelId: string): BulkLabelState {
  const newSelected = new Set(state.selectedLabels);
  if (newSelected.has(labelId)) {
    newSelected.delete(labelId);
  } else {
    newSelected.add(labelId);
  }
  return { ...state, selectedLabels: newSelected };
}

/**
 * Check if label is selected.
 */
export function isLabelSelected(state: BulkLabelState, labelId: string): boolean {
  return state.selectedLabels.has(labelId);
}

/**
 * Get selected labels count.
 */
export function getSelectedLabelCount(state: BulkLabelState): number {
  return state.selectedLabels.size;
}

/**
 * Get selected label IDs.
 */
export function getSelectedLabelIds(state: BulkLabelState): string[] {
  return Array.from(state.selectedLabels);
}

/**
 * Check if picker is open.
 */
export function isBulkLabelOpen(state: BulkLabelState): boolean {
  return state.isOpen;
}

/**
 * Check if has selected emails.
 */
export function hasSelectedEmails(state: BulkLabelState): boolean {
  return state.emailIds.length > 0;
}

/**
 * Get email count.
 */
export function getEmailCount(state: BulkLabelState): number {
  return state.emailIds.length;
}

/**
 * Get success message.
 */
export function getSuccessMessage(state: BulkLabelState): string {
  const labelCount = getSelectedLabelCount(state);
  const emailCount = getEmailCount(state);
  return `${labelCount} label${labelCount !== 1 ? "s" : ""} applied to ${emailCount} email${emailCount !== 1 ? "s" : ""}`;
}
