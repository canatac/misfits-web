import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/components/ui/error-boundary";

function ThrowingChild({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test render error");
  }
  return <div data-testid="child-content">Child rendered</div>;
}

function Bomb({ shouldThrow = true }: { shouldThrow?: boolean }) {
  return <ThrowingChild shouldThrow={shouldThrow} />;
}

function NoMessageError(): React.ReactNode {
  throw new Error();
}

describe("ErrorBoundary", () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child")).toBeTruthy();
    expect(screen.queryByTestId("error-boundary-fallback")).toBeNull();
  });

  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("Test render error")).toBeTruthy();
  });

  it("renders custom fallback when provided", () => {
    const CustomFallback = vi.fn(() => (
      <div data-testid="custom-fallback">Custom error UI</div>
    ));
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("custom-fallback")).toBeTruthy();
    expect(CustomFallback).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        resetErrorBoundary: expect.any(Function),
      }),
      undefined
    );
  });

  it("calls onError callback when a child throws", () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it("resets error state when 'Try again' is clicked", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();

    // Click the reset button wrapped in act to flush state updates
    act(() => {
      const resetButton = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(resetButton);
    });

    // After reset, re-render with a non-throwing child
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child-content")).toBeTruthy();
  });

  it("auto-resets when resetKeys change", () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={["key1"]}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();

    // Change resetKeys while in error state → should auto-reset
    rerender(
      <ErrorBoundary resetKeys={["key2"]}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("child-content")).toBeTruthy();
  });

  it("does not auto-reset when resetKeys stay the same", () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={["key1"]}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();

    // Same resetKeys → should stay in error state
    rerender(
      <ErrorBoundary resetKeys={["key1"]}>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-boundary-fallback")).toBeTruthy();
  });

  it("uses label in error logging", () => {
    render(
      <ErrorBoundary label="mail-sidebar">
        <Bomb />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[mail-sidebar]"),
      expect.any(Error),
      expect.any(Object)
    );
  });

  it("shows generic message when error has no message", () => {
    render(
      <ErrorBoundary>
        <NoMessageError />
      </ErrorBoundary>
    );
    expect(
      screen.getByText("An unexpected error occurred. Please try again.")
    ).toBeTruthy();
  });
});
