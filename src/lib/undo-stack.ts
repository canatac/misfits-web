/**
 * Undo for all destructive actions (Issue #437).
 *
 * Universal undo stack for archive, delete, star, label remove
 * with 5-second toast and LRU 10-entry limit.
 */

export interface UndoableAction {
  id: string;
  type: "archive" | "delete" | "star" | "unstar" | "label_add" | "label_remove" | "mark_read" | "mark_unread";
  emailIds: string[];
  previousState: Record<string, unknown>;
  timestamp: number;
  label?: string;
}

export interface UndoStackState {
  actions: UndoableAction[];
  maxSize: number;
  toastVisible: boolean;
  currentAction: UndoableAction | null;
  countdown: number;
}

export const DEFAULT_CONFIG = {
  maxSize: 10,
  toastDuration: 5000, // ms
};

/**
 * Create initial undo stack state.
 */
export function createUndoStack(maxSize: number = DEFAULT_CONFIG.maxSize): UndoStackState {
  return {
    actions: [],
    maxSize,
    toastVisible: false,
    currentAction: null,
    countdown: 0,
  };
}

/**
 * Push action onto undo stack (LRU eviction).
 */
export function pushAction(state: UndoStackState, action: UndoableAction): UndoStackState {
  const newActions = [...state.actions, action];
  while (newActions.length > state.maxSize) {
    newActions.shift();
  }
  return {
    ...state,
    actions: newActions,
    toastVisible: true,
    currentAction: action,
    countdown: DEFAULT_CONFIG.toastDuration,
  };
}

/**
 * Pop latest action from stack.
 */
export function popAction(state: UndoStackState): { state: UndoStackState; action: UndoableAction | null } {
  if (state.actions.length === 0) {
    return { state, action: null };
  }
  const action = state.actions[state.actions.length - 1];
  return {
    state: {
      ...state,
      actions: state.actions.slice(0, -1),
      toastVisible: false,
      currentAction: null,
    },
    action,
  };
}

/**
 * Peek latest action.
 */
export function peekAction(state: UndoStackState): UndoableAction | null {
  return state.actions.length > 0 ? state.actions[state.actions.length - 1] : null;
}

/**
 * Clear all actions.
 */
export function clearStack(state: UndoStackState): UndoStackState {
  return {
    ...state,
    actions: [],
    toastVisible: false,
    currentAction: null,
  };
}

/**
 * Hide toast.
 */
export function hideToast(state: UndoStackState): UndoStackState {
  return { ...state, toastVisible: false };
}

/**
 * Update countdown.
 */
export function updateCountdown(state: UndoStackState, remaining: number): UndoStackState {
  return { ...state, countdown: remaining };
}

/**
 * Check if toast is visible.
 */
export function isToastVisible(state: UndoStackState): boolean {
  return state.toastVisible;
}

/**
 * Get current action.
 */
export function getCurrentAction(state: UndoStackState): UndoableAction | null {
  return state.currentAction;
}

/**
 * Get stack size.
 */
export function getStackSize(state: UndoStackState): number {
  return state.actions.length;
}

/**
 * Check if stack is empty.
 */
export function isStackEmpty(state: UndoStackState): boolean {
  return state.actions.length === 0;
}

/**
 * Check if stack is full.
 */
export function isStackFull(state: UndoStackState): boolean {
  return state.actions.length >= state.maxSize;
}

/**
 * Get action type label.
 */
export function getActionTypeLabel(action: UndoableAction): string {
  switch (action.type) {
    case "archive": return "Archived";
    case "delete": return "Deleted";
    case "star": return "Starred";
    case "unstar": return "Unstarred";
    case "label_add": return "Label added";
    case "label_remove": return "Label removed";
    case "mark_read": return "Marked read";
    case "mark_unread": return "Marked unread";
    default: return "Action";
  }
}
