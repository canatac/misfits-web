import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComposerFooter } from "@/components/mail/composer/composer-footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Attachment } from "@/types/composer";

function mkAttachment(partial: Partial<Attachment> = {}): Attachment {
  return {
    id: partial.id ?? "att-1",
    filename: partial.filename ?? "facture.pdf",
    contentType: partial.contentType ?? "application/pdf",
    size: partial.size ?? 1024,
    progress: partial.progress ?? 100,
    status: partial.status ?? "done",
    ...partial,
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
          onJumpToAttachments={vi.fn()}
          onSend={vi.fn()}
          onSendLater={vi.fn()}
          onSaveDraft={vi.fn()}
          onDiscard={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByText(/2 pièces jointes/i)).toBeTruthy();
    expect(screen.getByText(/prête\(s\) à l.envoi/i)).toBeTruthy();
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
});
