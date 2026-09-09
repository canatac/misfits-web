import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KeyboardShortcutsHelp } from "@/components/mail/keyboard-shortcuts-help";

describe("KeyboardShortcutsHelp", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(
      <KeyboardShortcutsHelp open={false} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the help overlay when open is true", () => {
    render(<KeyboardShortcutsHelp open={true} onClose={() => {}} />);
    expect(screen.getByText("Raccourcis clavier")).toBeTruthy();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Fermer"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking the backdrop", () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when clicking inside the modal", () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Raccourcis clavier"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("displays all shortcut categories", () => {
    render(<KeyboardShortcutsHelp open={true} onClose={() => {}} />);
    expect(screen.getByText("Navigation")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("Affichage")).toBeTruthy();
  });

  it("shows the Ctrl+/ hint at the bottom", () => {
    render(<KeyboardShortcutsHelp open={true} onClose={() => {}} />);
    expect(screen.getByText(/Ctrl \+ \//)).toBeTruthy();
  });
});
