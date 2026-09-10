/**
 * Thread expand/collapse all (Issue #438).
 *
 * Expand all / collapse all button for thread view with
 * keyboard shortcut 'e' and collapsed count badge.
 */

export interface ThreadMessage {
  id: string;
  expanded: boolean;
}

export interface ThreadExpandState {
  messages: ThreadMessage[];
  allExpanded: boolean;
}

/**
 * Create thread expand state.
 */
export function createThreadExpandState(messageIds: string[]): ThreadExpandState {
  return {
    messages: messageIds.map((id, index) => ({
      id,
      expanded: index === messageIds.length - 1, // only last expanded
    })),
    allExpanded: false,
  };
}

/**
 * Expand all messages.
 */
export function expandAll(state: ThreadExpandState): ThreadExpandState {
  return {
    ...state,
    messages: state.messages.map((m) => ({ ...m, expanded: true })),
    allExpanded: true,
  };
}

/**
 * Collapse all messages (only last expanded).
 */
export function collapseAll(state: ThreadExpandState): ThreadExpandState {
  return {
    ...state,
    messages: state.messages.map((m, index) => ({
      ...m,
      expanded: index === state.messages.length - 1,
    })),
    allExpanded: false,
  };
}

/**
 * Toggle expand/collapse all.
 */
export function toggleExpandAll(state: ThreadExpandState): ThreadExpandState {
  return state.allExpanded ? collapseAll(state) : expandAll(state);
}

/**
 * Expand specific message.
 */
export function expandMessage(state: ThreadExpandState, messageId: string): ThreadExpandState {
  return {
    ...state,
    messages: state.messages.map((m) =>
      m.id === messageId ? { ...m, expanded: true } : m
    ),
  };
}

/**
 * Collapse specific message.
 */
export function collapseMessage(state: ThreadExpandState, messageId: string): ThreadExpandState {
  return {
    ...state,
    messages: state.messages.map((m) =>
      m.id === messageId ? { ...m, expanded: false } : m
    ),
  };
}

/**
 * Get collapsed count.
 */
export function getCollapsedCount(state: ThreadExpandState): number {
  return state.messages.filter((m) => !m.expanded).length;
}

/**
 * Get expanded count.
 */
export function getExpandedCount(state: ThreadExpandState): number {
  return state.messages.filter((m) => m.expanded).length;
}

/**
 * Check if all expanded.
 */
export function isAllExpanded(state: ThreadExpandState): boolean {
  return state.allExpanded;
}

/**
 * Check if button should be disabled (≤2 messages).
 */
export function isButtonDisabled(state: ThreadExpandState): boolean {
  return state.messages.length <= 2;
}

/**
 * Get button label.
 */
export function getButtonLabel(state: ThreadExpandState): string {
  if (state.allExpanded) return "Collapse all";
  const collapsed = getCollapsedCount(state);
  return collapsed > 0 ? `Expand all (${collapsed})` : "Expand all";
}

/**
 * Reset state for new thread.
 */
export function resetForNewThread(state: ThreadExpandState, messageIds: string[]): ThreadExpandState {
  return createThreadExpandState(messageIds);
}
