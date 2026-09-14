import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmailToolbar } from "@/components/mail/email-view/email-toolbar";

describe("EmailToolbar — forward as attachment", () => {
  const baseProps = {
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
    onForwardAsAttachment: vi.fn(),
  };

  it("renders 'Forward as Attachment' in the more-actions menu", () => {
    render(<EmailToolbar {...baseProps} />);
    const moreBtn = screen.getByRole("button", { name: /more actions/i });
    fireEvent.click(moreBtn);
    expect(
      screen.getByRole("menuitem", { name: /forward as attachment/i })
    ).toBeTruthy();
  });

  it("calls onForwardAsAttachment when clicked", () => {
    const onForwardAsAttachment = vi.fn();
    render(
      <EmailToolbar {...baseProps} onForwardAsAttachment={onForwardAsAttachment} />
    );
    const moreBtn = screen.getByRole("button", { name: /more actions/i });
    fireEvent.click(moreBtn);
    const menuItem = screen.getByRole("menuitem", {
      name: /forward as attachment/i,
    });
    fireEvent.click(menuItem);
    expect(onForwardAsAttachment).toHaveBeenCalledTimes(1);
  });
});
