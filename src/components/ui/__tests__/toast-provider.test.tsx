import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { ToastProvider, useToast } from "@/components/ui/toast-provider";

function TestComponent() {
  const { addToast, toasts } = useToast();
  return (
    <div>
      <button
        onClick={() =>
          addToast({ type: "archive", message: "Archived", undo: () => {} })
        }
      >
        Add Toast
      </button>
      <button
        onClick={() =>
          addToast({ type: "delete", message: "Deleted", undo: () => {} })
        }
      >
        Add Second Toast
      </button>
      <ul>
        {toasts.map((t) => (
          <li key={t.id} data-testid={`toast-${t.type}`}>
            {t.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a toast when addToast is called", () => {
    renderWithProvider(<TestComponent />);
    fireEvent.click(screen.getByText("Add Toast"));
    const toast = screen.getByTestId("toast-archive");
    expect(toast.textContent).toBe("Archived");
  });

  it("auto-removes toast after 5 seconds", () => {
    renderWithProvider(<TestComponent />);
    fireEvent.click(screen.getByText("Add Toast"));
    expect(screen.getByTestId("toast-archive")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByTestId("toast-archive")).toBeNull();
  });

  it("stacks toasts up to a maximum of 3", () => {
    renderWithProvider(<TestComponent />);
    fireEvent.click(screen.getByText("Add Toast"));
    fireEvent.click(screen.getByText("Add Second Toast"));
    fireEvent.click(screen.getByText("Add Toast"));
    fireEvent.click(screen.getByText("Add Second Toast"));
    expect(screen.getAllByRole("alert").length).toBe(3);
  });

  it("calls undo function when undo button is clicked", () => {
    const undoFn = vi.fn();
    function UndoTest() {
      const { addToast } = useToast();
      return (
        <button
          onClick={() =>
            addToast({ type: "delete", message: "Deleted", undo: undoFn })
          }
        >
          Delete
        </button>
      );
    }
    renderWithProvider(<UndoTest />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Annuler"));
    expect(undoFn).toHaveBeenCalledTimes(1);
  });

  it("removes toast when dismiss X is clicked", () => {
    renderWithProvider(<TestComponent />);
    fireEvent.click(screen.getByText("Add Toast"));
    expect(screen.getByTestId("toast-archive")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Close toast"));
    expect(screen.queryByTestId("toast-archive")).toBeNull();
  });
});
