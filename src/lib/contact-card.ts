/**
 * Contact quick-preview card (Issue #428).
 *
 * Hover card showing contact info, last interaction,
 * shared labels, and quick actions.
 */

export interface ContactPreview {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  lastInteraction: string;
  sharedLabels: Array<{ id: string; name: string; color: string }>;
  threadCount: number;
}

export interface ContactCardState {
  isVisible: boolean;
  contact: ContactPreview | null;
  hoverDelay: number;
}

export interface ContactCardAction {
  type: "SHOW" | "HIDE" | "SET_CONTACT";
  payload?: { contact?: ContactPreview };
}

export const DEFAULT_HOVER_DELAY = 300;

export const initialState: ContactCardState = {
  isVisible: false,
  contact: null,
  hoverDelay: DEFAULT_HOVER_DELAY,
};

/**
 * Reducer for contact card state.
 */
export function contactCardReducer(
  state: ContactCardState,
  action: ContactCardAction
): ContactCardState {
  switch (action.type) {
    case "SHOW":
      return { ...state, isVisible: true, contact: action.payload?.contact ?? state.contact };
    case "HIDE":
      return { ...state, isVisible: false };
    case "SET_CONTACT":
      return { ...state, contact: action.payload?.contact ?? null };
    default:
      return state;
  }
}

/**
 * Show contact card.
 */
export function showContactCard(contact: ContactPreview): ContactCardAction {
  return { type: "SHOW", payload: { contact } };
}

/**
 * Hide contact card.
 */
export function hideContactCard(): ContactCardAction {
  return { type: "HIDE" };
}

/**
 * Set contact for card.
 */
export function setContact(contact: ContactPreview): ContactCardAction {
  return { type: "SET_CONTACT", payload: { contact } };
}

/**
 * Check if card is visible.
 */
export function isContactCardVisible(state: ContactCardState): boolean {
  return state.isVisible;
}

/**
 * Get current contact.
 */
export function getCurrentContact(state: ContactCardState): ContactPreview | null {
  return state.contact;
}

/**
 * Get hover delay.
 */
export function getHoverDelay(state: ContactCardState): number {
  return state.hoverDelay;
}
