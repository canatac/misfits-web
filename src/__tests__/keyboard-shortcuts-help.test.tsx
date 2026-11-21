import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { KeyboardShortcutsHelp, HelpButton } from "@/components/mail/keyboard-shortcuts-help";

afterEach(() => cleanup());

describe("KeyboardShortcutsHelp (MW-2026-122)", () => {
  it("renders nothing when closed", () => {
    render(<KeyboardShortcutsHelp open={false} onClose={() => {}} />);
    expect(screen.queryByTestId("keyboard-shortcuts-help")).toBeNull();
  });

  it("opens from the composer toolbar help button", () => {
    const onClose = vi.fn();
    render(
      <div>
        <HelpButton onClick={() => {}} />
        <KeyboardShortcutsHelp open={true} onClose={onClose} />
      </div>
    );
    expect(screen.getByTestId("keyboard-shortcuts-help")).toBeTruthy();
    expect(screen.getByText("Raccourcis clavier")).toBeTruthy();
  });

  it("groups shortcuts by category", () => {
    render(<KeyboardShortcutsHelp open={true} onClose={() => {}} />);
    for (const category of ["Navigation", "Actions", "Recherche", "Édition"]) {
      expect(screen.getByText(category)).toBeTruthy();
    }
  });

  it("filters by shortcut name", () => {
    render(<KeyboardShortcutsHelp open={true} onClose={() => {}} />);
    const input = screen.getByLabelText("Filtrer les raccourcis");
    fireEvent.change(input, { target: { value: "archiver" } });
    expect(screen.getByText("Archiver")).toBeTruthy();
    expect(screen.queryByText("Répondre")).toBeNull();
  });

  it("shows a link to the full documentation", () => {
    render(<KeyboardShortcutsHelp open={true} onClose={() => {}} />);
    const link = screen.getByText("Documentation complète");
    expect(link.getAttribute("href")).toBe("/docs/USAGE.md");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on click outside", () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("keyboard-shortcuts-help"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
