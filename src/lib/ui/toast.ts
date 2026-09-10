/**
 * Toast event bus — pure lib/ module with zero React dependency.
 * Components/ui/toast-provider.tsx subscribes to dispatch events;
 * hooks/stores call addToast() directly without importing components.
 */
export type ToastType = "archive" | "delete" | "read" | "star";

export interface ToastInput {
  type: ToastType;
  message: string;
  undo: () => void;
}

type Listener = (input: ToastInput) => void;

let listener: Listener | null = null;

/**
 * Subscribe to toast dispatch events.
 * Returns an unsubscribe function. Only one subscriber at a time.
 */
export function subscribeToToasts(fn: Listener): () => void {
  listener = fn;
  return () => {
    listener = null;
  };
}

/**
 * Dispatch a toast. No-op if no subscriber is registered yet.
 */
export function addToast(input: ToastInput): void {
  if (listener) listener(input);
}
