"use client";

/**
 * ErrorBoundary — class component implementing React's error boundary hooks.
 *
 * Uses getDerivedStateFromError to flip hasError state when a child throws,
 * and componentDidCatch for side effects (logging / reporting).
 *
 * The fallback UI offers a graceful degradation path and a "Try again"
 * button that resets the boundary state, letting the user recover
 * without a full page reload.
 */
import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps extends React.PropsWithChildren {
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: React.DependencyList;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const DefaultFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center"
    data-testid="error-boundary-fallback"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-50)] text-[var(--color-danger-500)]">
      <AlertTriangle className="h-6 w-6" aria-hidden="true" />
    </div>
    <div className="flex flex-col gap-1.5">
      <h2 className="text-lg font-semibold text-[var(--color-fg)]">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-[var(--color-muted-fg)]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
    </div>
    <Button variant="outline" size="default" onClick={resetErrorBoundary}>
      <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
      Try again
    </Button>
  </div>
);

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError, label } = this.props;
    if (onError) {
      onError(error, errorInfo);
    }
    console.error(
      `ErrorBoundary${label ? ` [${label}]` : ""} caught an error:`,
      error,
      errorInfo
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    if (
      this.state.hasError &&
      prevProps.resetKeys &&
      resetKeys &&
      prevProps.resetKeys.some((key, idx) => key !== resetKeys[idx])
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback = DefaultFallback } = this.props;

    if (hasError && error) {
      return (
        <Fallback error={error} resetErrorBoundary={this.resetErrorBoundary} />
      );
    }

    return children;
  }
}

export { ErrorBoundary };
export type { ErrorBoundaryProps, ErrorBoundaryState };
