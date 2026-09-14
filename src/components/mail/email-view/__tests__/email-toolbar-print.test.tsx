import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailToolbar } from "@/components/mail/email-view/email-toolbar";

describe("EmailToolbar — Print / PDF export", () => {
  const defaultProps = {
    isStarred: false,
    onArchive: vi.fn(),
    onDelete: vi.fn(),
    onMarkUnread: vi.fn(),
    onReply: vi.fn(),
    onReplyAll: vi.fn(),
    onForward: vi.fn(),
    onToggleStar: vi.fn(),
    onHermesSummarize: vi.fn(),
    onHermesReplyDraft: vi.fn(),
    onHermesTranslate: vi.fn(),
    onHermesTodos: vi.fn(),
    onPrint: vi.fn(),
  };

  it("renders a print button with correct aria-label", () => {
    render(<EmailToolbar {...defaultProps} />);
    const printBtn = screen.getByTestId("print-email-btn");
    expect(printBtn).toBeTruthy();
    expect(printBtn.getAttribute("aria-label")).toBe("Print / Export PDF");
  });

  it("calls onPrint when the print button is clicked", () => {
    const onPrint = vi.fn();
    render(<EmailToolbar {...defaultProps} onPrint={onPrint} />);
    fireEvent.click(screen.getByTestId("print-email-btn"));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it("has a title hinting at the keyboard shortcut", () => {
    render(<EmailToolbar {...defaultProps} />);
    const printBtn = screen.getByTestId("print-email-btn");
    expect(printBtn.getAttribute("title")).toBe("Print / Export PDF (Ctrl+P)");
  });
});
