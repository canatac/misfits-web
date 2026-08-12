"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps extends React.PropsWithChildren {
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: React.DependencyList;
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
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
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
export type { ErrorBoundaryProps };
