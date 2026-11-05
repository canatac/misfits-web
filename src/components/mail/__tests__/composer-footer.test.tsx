import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ComposerFooter } from "../composer/composer-footer";
import type { Attachment } from "@/types/composer";

function mkAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: "att-1",
    filename: "facture.pdf",
    contentType: "application/pdf",
    size: 1024,
    progress: 100,
    status: "done",
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

    expect(screen.getByText(/2 pièces jointes/i)).toBeTruthy();
    expect(screen.getByText(/prête\(s\) à l'envoi/i)).toBeTruthy();
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

    fireEvent.click(screen.getByRole("button", { name: /voir/i }));
    expect(onJumpToAttachments).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/upload en cours/i)).toBeTruthy();
  });

  it("renders Brouillon and Envoyer plus tard buttons", () => {
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
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(
      screen.getByRole("button", { name: /sauvegarder le brouillon/i })
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /envoyer plus tard/i })
    ).toBeTruthy();
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

    fireEvent.click(
      screen.getByRole("button", { name: /sauvegarder le brouillon/i })
    );
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
  });

  it("disables Brouillon and Envoyer plus tard when composer is empty", () => {
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

    const brouillonBtn = screen.getByRole("button", {
      name: /sauvegarder le brouillon/i,
    });
    const sendLaterBtn = screen.getByRole("button", {
      name: /envoyer plus tard/i,
    });
    expect((brouillonBtn as HTMLButtonElement).disabled).toBe(true);
    expect((sendLaterBtn as HTMLButtonElement).disabled).toBe(true);
  });

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
