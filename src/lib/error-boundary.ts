/**
 * Error boundary fallback UI (Issue #439).
 *
 * Graceful error recovery with retry, reload, and debug details.
 */

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  showDetails: boolean;
}

export interface ErrorBoundaryAction {
  type: "SET_ERROR" | "CLEAR_ERROR" | "TOGGLE_DETAILS";
  payload?: { error?: Error | null; errorInfo?: string | null };
}

export const initialState: ErrorBoundaryState = {
  hasError: false,
  error: null,
  errorInfo: null,
  showDetails: false,
};

/**
 * Reducer for error boundary state.
 */
export function errorBoundaryReducer(
  state: ErrorBoundaryState,
  action: ErrorBoundaryAction
): ErrorBoundaryState {
  switch (action.type) {
    case "SET_ERROR":
      return {
        ...state,
        hasError: true,
        error: action.payload?.error ?? null,
        errorInfo: action.payload?.errorInfo ?? null,
      };
    case "CLEAR_ERROR":
      return { ...initialState };
    case "TOGGLE_DETAILS":
      return { ...state, showDetails: !state.showDetails };
    default:
      return state;
  }
}

/**
 * Set error state.
 */
export function setError(error: Error, errorInfo?: string): ErrorBoundaryAction {
  return { type: "SET_ERROR", payload: { error, errorInfo } };
}

/**
 * Clear error state.
 */
export function clearError(): ErrorBoundaryAction {
  return { type: "CLEAR_ERROR" };
}

/**
 * Toggle error details visibility.
 */
export function toggleDetails(): ErrorBoundaryAction {
  return { type: "TOGGLE_DETAILS" };
}

/**
 * Check if has error.
 */
export function hasError(state: ErrorBoundaryState): boolean {
  return state.hasError;
}

/**
 * Get error message.
 */
export function getErrorMessage(state: ErrorBoundaryState): string {
  return state.error?.message ?? "Unknown error";
}

/**
 * Get error stack trace.
 */
export function getErrorStack(state: ErrorBoundaryState): string | null {
  return state.error?.stack ?? null;
}

/**
 * Check if details are visible.
 */
export function isDetailsVisible(state: ErrorBoundaryState): boolean {
  return state.showDetails;
}

/**
 * Get error details for debugging.
 */
export function getErrorDetails(state: ErrorBoundaryState): string {
  const error = state.error;
  if (!error) return "";

  const parts = [
    `Error: ${error.name}: ${error.message}`,
    error.stack ?? "",
    state.errorInfo ?? "",
  ];

  return parts.filter(Boolean).join("\n\n");
}

/**
 * Log error to console.
 */
export function logError(state: ErrorBoundaryState): void {
  if (state.error) {
    console.error("[ErrorBoundary]", state.error);
    if (state.errorInfo) {
      console.error("[ErrorBoundary] Info:", state.errorInfo);
    }
  }
}
