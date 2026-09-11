/**
 * ARIA live regions for toast notifications (Issue #419).
 *
 * WCAG 2.2 AA compliant toast announcements with context-rich
 * messages for screen readers.
 */

export type ToastRole = "status" | "alert";

export interface ToastMessage {
  id: string;
  message: string;
  role: ToastRole;
  timestamp: number;
  context?: string;
}

export interface AriaLiveState {
  toasts: ToastMessage[];
  liveRegion: "polite" | "assertive";
}

export interface AriaLiveAction {
  type: "ADD_TOAST" | "REMOVE_TOAST" | "CLEAR_ALL";
  payload?: { toast?: ToastMessage };
}

export const initialState: AriaLiveState = {
  toasts: [],
  liveRegion: "polite",
};

/**
 * Reducer for ARIA live state.
 */
export function ariaLiveReducer(
  state: AriaLiveState,
  action: AriaLiveAction
): AriaLiveState {
  switch (action.type) {
    case "ADD_TOAST":
      if (!action.payload?.toast) return state;
      return {
        ...state,
        toasts: [...state.toasts, action.payload.toast],
        liveRegion: action.payload.toast.role === "alert" ? "assertive" : "polite",
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload?.toast?.id),
      };
    case "CLEAR_ALL":
      return { ...state, toasts: [] };
    default:
      return state;
  }
}

/**
 * Add toast message.
 */
export function addToast(message: string, role: ToastRole = "status", context?: string): AriaLiveAction {
  return {
    type: "ADD_TOAST",
    payload: {
      toast: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        message,
        role,
        timestamp: Date.now(),
        context,
      },
    },
  };
}

/**
 * Remove toast message.
 */
export function removeToast(toastId: string): AriaLiveAction {
  return { type: "REMOVE_TOAST", payload: { toast: { id: toastId, message: "", role: "status", timestamp: 0 } } };
}

/**
 * Clear all toasts.
 */
export function clearToasts(): AriaLiveAction {
  return { type: "CLEAR_ALL" };
}

/**
 * Get toast count.
 */
export function getToastCount(state: AriaLiveState): number {
  return state.toasts.length;
}

/**
 * Check if has error toasts.
 */
export function hasErrorToasts(state: AriaLiveState): boolean {
  return state.toasts.some((t) => t.role === "alert");
}

/**
 * Get live region attribute.
 */
export function getLiveRegion(role: ToastRole): string {
  return role === "alert" ? "assertive" : "polite";
}

/**
 * Get context-rich message.
 */
export function getContextMessage(action: string, subject: string): string {
  return `${action}: ${subject}`;
}
