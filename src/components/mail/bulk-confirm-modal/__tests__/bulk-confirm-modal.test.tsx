import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BulkConfirmModal } from "@/components/mail/bulk-confirm-modal/bulk-confirm-modal";

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

describe("BulkConfirmModal", () => {
  const defaultProps = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    actionLabel: "Supprimer",
    emailCount: 10,
  };

  it("renders when open is true", () => {
    render(<BulkConfirmModal {...defaultProps} />);
    expect(screen.getByText("Supprimer × 10 emails ?")).toBeTruthy();
  });

  it("does not render when open is false", () => {
    render(<BulkConfirmModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Supprimer × 10 emails ?")).toBeNull();
  });

  it("confirm button starts disabled with countdown", () => {
    render(<BulkConfirmModal {...defaultProps} />);
    const confirmButton = screen.getByText("Confirmer (3)").closest("button");
    expect(confirmButton?.disabled).toBe(true);
  });

  it("confirm button becomes enabled after countdown", () => {
    render(<BulkConfirmModal {...defaultProps} />);
    // Advance timers past countdown
    vi.advanceTimersByTime(3500);
    const confirmButton = screen.getByText("Confirmer").closest("button");
    expect(confirmButton?.disabled).toBe(false);
  });

  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(<BulkConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    vi.advanceTimersByTime(3500);
    const confirmButton = screen.getByText("Confirmer").closest("button");
    fireEvent.click(confirmButton!);
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(<BulkConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Annuler"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when backdrop clicked", () => {
    const onCancel = vi.fn();
    render(<BulkConfirmModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByLabelText("Fermer la modale"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("handles skipForSession checkbox", () => {
    const onConfirm = vi.fn();
    render(<BulkConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    vi.advanceTimersByTime(3500);
    fireEvent.click(screen.getByLabelText("Ne plus demander pour cette session"));
    const confirmButton = screen.getByText("Confirmer").closest("button");
    fireEvent.click(confirmButton!);
    expect(onConfirm).toHaveBeenCalledWith(true);
  });
});
