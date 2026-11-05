import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComposerFooter } from "@/components/mail/composer/composer-footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Attachment } from "@/types/composer";

function mkAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: "att-1",
    name: "file.txt",
    size: 1024,
    mimeType: "text/plain",
    status: "done",
    progress: 100,
    ...overrides,
  } as Attachment;
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

    fireEvent.click(screen.getByRole("button", { name: /attachments/i }));
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

    fireEvent.click(screen.getByRole("button", { name: /Brouillon/i }));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
  });

  it("disables send and send-later while sending", () => {
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={true}
          canSend={false}
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

    const sendBtn = screen.getByRole("button", { name: /Envoyer/i }) as HTMLButtonElement;
    expect(sendBtn.disabled).toBe(true);
  });

  it("disables actions when composer is empty", () => {
    render(
      <TooltipProvider>
        <ComposerFooter
          isSending={false}
          canSend
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

    const brouillonBtn = screen.getByRole("button", { name: /Brouillon/i }) as HTMLButtonElement;
    const sendLaterBtn = screen.getByRole("button", { name: /Send later/i }) as HTMLButtonElement;
    expect(brouillonBtn.disabled).toBe(true);
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
});
