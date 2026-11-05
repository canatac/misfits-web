import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ComposerFooter } from "../composer/composer-footer";
import type { Attachment } from "@/types/composer";

function mkAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: "att-1",
    name: "file.txt",
    size: 10,
    mimeType: "text/plain",
    status: "done",
    progress: 100,
    ...overrides,
  } as Attachment;
}

describe("ComposerFooter", () => {
  it("renders the send and send-later buttons", () => {
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

    expect(screen.getByRole("button", { name: "Envoyer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /envoyer plus tard/i })).toBeTruthy();
  });

  it("calls onSend when the send button is clicked", () => {
    const onSend = vi.fn();
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
          attachments={[mkAttachment({ status: "uploading", progress: 40 })]}
          isComposerEmpty={false}
          recipientCount={0}
          onJumpToAttachments={vi.fn()}
          onSend={onSend}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("shows the attachment count and jumps to attachments", () => {
    const onJumpToAttachments = vi.fn();
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
          attachments={[]}
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

    expect(onJumpToAttachments).not.toHaveBeenCalled();
  });

  it("disables send when the composer is empty", () => {
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

    const sendBtn = screen.getByRole("button", { name: "Envoyer" }) as HTMLButtonElement;
    const sendLaterBtn = screen.getByRole("button", { name: /envoyer plus tard/i }) as HTMLButtonElement;
    expect(sendBtn.disabled).toBe(true);
    expect(sendLaterBtn.disabled).toBe(true);
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

  it("calls onSend with the current recipient count when Envoyer is clicked", () => {
    const onSend = vi.fn();
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
          attachments={[]}
          isComposerEmpty={false}
          recipientCount={12}
          onJumpToAttachments={vi.fn()}
          onSend={onSend}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
