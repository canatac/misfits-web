import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComposerToolbar } from "@/components/mail/composer/composer-toolbar";

describe("ComposerToolbar keyboard shortcuts entry point", () => {
  const renderToolbar = () =>
    render(
      <ComposerToolbar
        isDirty={false}
        isSending={false}
        isCompact={false}
        isFullScreen={false}
        showAIPanel={false}
        aiGenerating={false}
        sendLaterDate=""
        saveStatus="saved"
        lastSavedAt={null}
        onToggleAI={() => {}}
        onSetSendLaterDate={() => {}}
        onSendLater={() => {}}
        onSaveDraft={() => {}}
        onToggleCompact={() => {}}
        onToggleFullScreen={() => {}}
      />,
    );

  it("opens the cheat sheet modal when the toolbar button is clicked", () => {
    renderToolbar();

    expect(screen.queryByText("Raccourcis clavier")).toBeNull();

    fireEvent.click(screen.getByLabelText("Keyboard shortcuts"));

    expect(screen.getByText("Raccourcis clavier")).toBeTruthy();
  });

  it("closes the cheat sheet modal via the close button", () => {
    renderToolbar();

    fireEvent.click(screen.getByLabelText("Keyboard shortcuts"));
    fireEvent.click(screen.getByLabelText("Fermer"));

    expect(screen.queryByText("Raccourcis clavier")).toBeNull();
  });
});
