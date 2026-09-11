/**
 * Label quick-filter from sidebar (Issue #425).
 *
 * Click a label in sidebar to filter inbox with
 * dismissable banner and active state highlighting.
 */

export interface LabelFilterState {
  activeLabelId: string | null;
  activeLabelName: string | null;
  filterBannerVisible: boolean;
}

export interface LabelFilterAction {
  type: "SET_FILTER" | "CLEAR_FILTER" | "DISMISS_BANNER";
  payload?: { labelId?: string; labelName?: string };
}

export const initialState: LabelFilterState = {
  activeLabelId: null,
  activeLabelName: null,
  filterBannerVisible: false,
};

/**
 * Reducer for label filter state.
 */
export function labelFilterReducer(
  state: LabelFilterState,
  action: LabelFilterAction
): LabelFilterState {
  switch (action.type) {
    case "SET_FILTER":
      return {
        ...state,
        activeLabelId: action.payload?.labelId ?? null,
        activeLabelName: action.payload?.labelName ?? null,
        filterBannerVisible: true,
      };
    case "CLEAR_FILTER":
      return { ...initialState };
    case "DISMISS_BANNER":
      return { ...state, filterBannerVisible: false };
    default:
      return state;
  }
}

/**
 * Set label filter.
 */
export function setLabelFilter(labelId: string, labelName: string): LabelFilterAction {
  return { type: "SET_FILTER", payload: { labelId, labelName } };
}

/**
 * Clear label filter.
 */
export function clearLabelFilter(): LabelFilterAction {
  return { type: "CLEAR_FILTER" };
}

/**
 * Dismiss filter banner.
 */
export function dismissBanner(): LabelFilterAction {
  return { type: "DISMISS_BANNER" };
}

/**
 * Check if label is active.
 */
export function isLabelActive(state: LabelFilterState, labelId: string): boolean {
  return state.activeLabelId === labelId;
}

/**
 * Check if has active filter.
 */
export function hasActiveFilter(state: LabelFilterState): boolean {
  return state.activeLabelId !== null;
}

/**
 * Get active label ID.
 */
export function getActiveLabelId(state: LabelFilterState): string | null {
  return state.activeLabelId;
}

/**
 * Get active label name.
 */
export function getActiveLabelName(state: LabelFilterState): string | null {
  return state.activeLabelName;
}

/**
 * Check if filter banner is visible.
 */
export function isBannerVisible(state: LabelFilterState): boolean {
  return state.filterBannerVisible;
}

/**
 * Check if email matches label filter.
 */
export function emailMatchesLabel(
  emailLabels: string[],
  assignments: Record<string, string[]>,
  emailId: string,
  activeLabelId: string | null
): boolean {
  if (!activeLabelId) return true;
  return emailLabels.includes(activeLabelId) || (assignments[emailId]?.includes(activeLabelId) ?? false);
}
