/**
 * Error boundary utilities (Issue #439).
 */

import { useI18n } from "@/i18n/provider";

export interface ErrorInfo {
  message: string;
  stack?: string;
  digest?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface RecoveryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: (attempt: number) => void;
  onReset?: () => void;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showErrorDetails?: boolean;
  allowReload?: boolean;
  allowRetry?: boolean;
}

export function getDefaultRecoveryOptions(t: (key: string) => string): Required<Pick<RecoveryOptions, "maxRetries" | "retryDelayMs" | "showErrorDetails" | "allowReload" | "allowRetry">> & { fallbackTitle: string; fallbackMessage: string } {
  return {
    maxRetries: 3,
    retryDelayMs: 1000,
    showErrorDetails: false,
    allowReload: true,
    allowRetry: true,
    fallbackTitle: t("errorBoundary.fallbackTitle"),
    fallbackMessage: t("errorBoundary.fallbackMessage"),
  };
}

export function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function parseError(error: Error): ErrorInfo {
  return { message: error.message || "Unknown error", stack: error.stack };
}

export function isRecoverableError(error: Error): boolean {
  if (error.name === "NetworkError" || error.name === "TimeoutError") return true;
  if (error instanceof SyntaxError || error instanceof TypeError) return false;
  return true;
}

export function createInitialErrorState(): ErrorBoundaryState {
  return { hasError: false, error: null, errorInfo: null };
}

export function getRetryDelay(attempt: number, baseDelayMs: number = 1000): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt), 30000);
}

export function formatErrorMessage(error: Error): string {
  if (error.message) return error.message.replace(/^Error:\s*/, "").replace(/\n/g, " ").trim();
  return "An unknown error occurred";
}

export function createErrorLogEntry(error: Error, errorId: string, context?: Record<string, unknown>): Record<string, unknown> {
  return { errorId, timestamp: new Date().toISOString(), message: error.message, stack: error.stack, name: error.name, ...context };
}

// Legacy export for backwards compatibility - use getDefaultRecoveryOptions with i18n instead
export const DEFAULT_RECOVERY_OPTIONS: Required<Pick<RecoveryOptions, "maxRetries" | "retryDelayMs" | "showErrorDetails" | "allowReload" | "allowRetry">> & { fallbackTitle: string; fallbackMessage: string } = {
  maxRetries: 3,
  retryDelayMs: 1000,
  showErrorDetails: false,
  allowReload: true,
  allowRetry: true,
  fallbackTitle: "errorBoundary.fallbackTitle",
  fallbackMessage: "errorBoundary.fallbackMessage",
};