import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailToolbar } from "@/components/mail/email-view/email-toolbar";

describe("EmailToolbar — Reply All indicator", () => {
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

  it("does not show recipient count badge when only 1 recipient (no cc)", () => {
    render(<EmailToolbar {...defaultProps} replyAllRecipientCount={1} />);
    expect(screen.queryByTestId("reply-all-count")).toBeNull();
  });

  it("shows recipient count badge when replying to multiple recipients", () => {
    render(<EmailToolbar {...defaultProps} replyAllRecipientCount={4} />);
    const badge = screen.getByTestId("reply-all-count");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("4");
  });

  it("hides badge when replyAllRecipientCount is undefined (defaults to 1)", () => {
    render(<EmailToolbar {...defaultProps} />);
    expect(screen.queryByTestId("reply-all-count")).toBeNull();
  });

  it("displays the correct number for a large recipient list", () => {
    render(<EmailToolbar {...defaultProps} replyAllRecipientCount={12} />);
    const badge = screen.getByTestId("reply-all-count");
    expect(badge.textContent).toBe("12");
  });
});
