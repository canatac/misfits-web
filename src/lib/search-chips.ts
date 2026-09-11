/**
 * Expanded search bar with inline filter chips (Issue #415).
 *
 * Inline filter chips showing parsed search operators with
 * deletable tokens and clear all button.
 */

export interface FilterChip {
  id: string;
  key: string;
  value: string;
  raw: string;
}

export interface SearchBarState {
  query: string;
  chips: FilterChip[];
  showHints: boolean;
}

export interface SearchBarAction {
  type: "SET_QUERY" | "ADD_CHIP" | "REMOVE_CHIP" | "CLEAR_ALL" | "SHOW_HINTS" | "HIDE_HINTS";
  payload?: { query?: string; chip?: FilterChip; chipId?: string };
}

export const initialState: SearchBarState = {
  query: "",
  chips: [],
  showHints: false,
};

/**
 * Parse query into chips.
 */
export function parseQueryToChips(query: string): FilterChip[] {
  const chips: FilterChip[] = [];
  const regex = /(\w+):(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(query)) !== null) {
    chips.push({
      id: `${match[1]}-${match[2]}-${match.index}`,
      key: match[1],
      value: match[2],
      raw: match[0],
    });
  }

  return chips;
}

/**
 * Reducer for search bar state.
 */
export function searchBarReducer(
  state: SearchBarState,
  action: SearchBarAction
): SearchBarState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload?.query ?? "" };
    case "ADD_CHIP":
      if (!action.payload?.chip) return state;
      return { ...state, chips: [...state.chips, action.payload.chip] };
    case "REMOVE_CHIP":
      return {
        ...state,
        chips: state.chips.filter((c) => c.id !== action.payload?.chipId),
      };
    case "CLEAR_ALL":
      return { ...initialState };
    case "SHOW_HINTS":
      return { ...state, showHints: true };
    case "HIDE_HINTS":
      return { ...state, showHints: false };
    default:
      return state;
  }
}

/**
 * Get chips from query.
 */
export function getChipsFromQuery(query: string): FilterChip[] {
  return parseQueryToChips(query);
}

/**
 * Remove chip from query.
 */
export function removeChipFromQuery(query: string, chip: FilterChip): string {
  return query.replace(chip.raw, "").trim();
}

/**
 * Check if has chips.
 */
export function hasChips(state: SearchBarState): boolean {
  return state.chips.length > 0;
}

/**
 * Get chip count.
 */
export function getChipCount(state: SearchBarState): number {
  return state.chips.length;
}

/**
 * Check if hints are visible.
 */
export function isHintsVisible(state: SearchBarState): boolean {
  return state.showHints;
}

/**
 * Get operator hints.
 */
export function getOperatorHints(): Array<{ key: string; label: string; description: string }> {
  return [
    { key: "from", label: "From", description: "Sender email or name" },
    { key: "to", label: "To", description: "Recipient email or name" },
    { key: "has", label: "Has", description: "attachment, image, etc." },
    { key: "after", label: "After", description: "Date (YYYY-MM-DD)" },
    { key: "before", label: "Before", description: "Date (YYYY-MM-DD)" },
    { key: "subject", label: "Subject", description: "Email subject" },
  ];
}
