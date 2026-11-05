import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComposerFooter } from "@/components/mail/composer/composer-footer";
import { TooltipProvider } from "@/components/ui/tooltip";

function mkAttachment(overrides = {}) {
  return {
    id: "att-1",
    name: "file.txt",
    size: 1024,
    type: "text/plain",
    status: "done",
    progress: 100,
    ...overrides,
  };
}

describe("ComposerFooter", () => {
  it("shows attachment summary in compact composer", () => {
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
          attachments={[mkAttachment(), mkAttachment({ id: "att-2" })]}
          isComposerEmpty={false}
          recipientCount={0}
          onJumpToAttachments={vi.fn()}
          onSend={vi.fn()}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByText(/2 attachments/i)).toBeTruthy();
  });

  it("lets user jump to attachment zone", () => {
    const onJumpToAttachments = vi.fn();
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
          attachments={[mkAttachment({ status: "uploading", progress: 40 })]}
          isComposerEmpty={false}
          recipientCount={0}
          onJumpToAttachments={onJumpToAttachments}
          onSend={vi.fn()}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByText(/1 attachment/i));
    expect(onJumpToAttachments).toHaveBeenCalledTimes(1);
  });

  it("calls onSaveDraft when Brouillon is clicked", () => {
    const onSaveDraft = vi.fn();
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
          attachments={[]}
          isComposerEmpty={false}
          recipientCount={0}
          onJumpToAttachments={vi.fn()}
          onSend={vi.fn()}
          onSendLater={vi.fn()}
          onSaveDraft={onSaveDraft}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /brouillon/i }));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
  });

  it("disables send actions while sending", () => {
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={true}
          canSend
          attachments={[]}
          isComposerEmpty={false}
          recipientCount={0}
          onJumpToAttachments={vi.fn()}
          onSend={vi.fn()}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    const sendBtn = screen.getByRole("button", { name: /envoyer/i });
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables actions when the composer is empty", () => {
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend={false}
          attachments={[]}
          isComposerEmpty={true}
          recipientCount={0}
          onJumpToAttachments={vi.fn()}
          onSend={vi.fn()}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    const brouillonBtn = screen.getByRole("button", { name: /brouillon/i });
    const sendLaterBtn = screen.getByRole("button", { name: /send later|programmer/i });
    expect((brouillonBtn as HTMLButtonElement).disabled).toBe(true);
    expect((sendLaterBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows the recipient count in the footer", () => {
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
          attachments={[]}
          isComposerEmpty={false}
          recipientCount={15}
          onJumpToAttachments={vi.fn()}
          onSend={vi.fn()}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByTestId("recipient-count").textContent).toContain("15");
    expect(screen.getByTestId("recipient-count").textContent).toContain(
      "recipients"
    );
  });
});
