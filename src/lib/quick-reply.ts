/**
 * Compose from search results (Issue #456).
 *
 * Inline quick reply panel for search results with pre-filled
 * recipient, subject, and keyboard shortcut support.
 */

export interface QuickReplyState {
  visible: boolean;
  recipient: string;
  subject: string;
  body: string;
  originalMessageId?: string;
}

export interface QuickReplyAction {
  type: "OPEN" | "CLOSE" | "UPDATE_BODY" | "RESET";
  payload?: Partial<QuickReplyState>;
}

export const initialState: QuickReplyState = {
  visible: false,
  recipient: "",
  subject: "",
  body: "",
  originalMessageId: undefined,
};

/**
 * Reducer for quick reply state.
 */
export function quickReplyReducer(
  state: QuickReplyState,
  action: QuickReplyAction
): QuickReplyState {
  switch (action.type) {
    case "OPEN":
      return { ...state, ...action.payload, visible: true };
    case "CLOSE":
      return { ...initialState };
    case "UPDATE_BODY":
      return { ...state, body: action.payload?.body ?? "" };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

/**
 * Open quick reply with pre-filled data.
 */
export function openQuickReply(
  recipient: string,
  subject: string,
  originalMessageId?: string
): QuickReplyAction {
  return {
    type: "OPEN",
    payload: { recipient, subject, originalMessageId, body: "" },
  };
}

/**
 * Close quick reply panel.
 */
export function closeQuickReply(): QuickReplyAction {
  return { type: "CLOSE" };
}

/**
 * Update reply body.
 */
export function updateReplyBody(body: string): QuickReplyAction {
  return { type: "UPDATE_BODY", payload: { body } };
}

/**
 * Reset quick reply state.
 */
export function resetQuickReply(): QuickReplyAction {
  return { type: "RESET" };
}

/**
 * Validate email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Get prefilled subject for reply.
 */
export function getReplySubject(originalSubject: string): string {
  if (!originalSubject.toLowerCase().startsWith("re:")) {
    return `Re: ${originalSubject}`;
  }
  return originalSubject;
}

/**
 * Check if quick reply is visible.
 */
export function isQuickReplyVisible(state: QuickReplyState): boolean {
  return state.visible;
}

/**
 * Get reply state summary.
 */
export function getReplySummary(state: QuickReplyState): string {
  if (!state.recipient || !state.subject) return "Empty reply";
  return `Reply to ${state.recipient} about "${state.subject}"`;
}
