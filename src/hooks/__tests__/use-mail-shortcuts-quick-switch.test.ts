/**
 * Tests for quick account switching keyboard shortcuts (Issue #445).
 * Verifies that Ctrl+Shift+[ / ] cycles accounts and Ctrl+1..9 jumps to a
 * specific account index via the useMailShortcuts hook.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMailShortcuts } from "@/hooks/use-mail-shortcuts";

describe("useMailShortcuts — quick account switching (Issue #445)", () => {
  let handlers: {
    onNext: ReturnType<typeof vi.fn>;
    onPrev: ReturnType<typeof vi.fn>;
    onArchive: ReturnType<typeof vi.fn>;
    onDelete: ReturnType<typeof vi.fn>;
    onCompose: ReturnType<typeof vi.fn>;
    onSearchFocus: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    onToggleShortcutsHelp: ReturnType<typeof vi.fn>;
    onCycleAccount: ReturnType<typeof vi.fn>;
    onJumpToAccount: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    handlers = {
      onNext: vi.fn(),
      onPrev: vi.fn(),
      onArchive: vi.fn(),
      onDelete: vi.fn(),
      onCompose: vi.fn(),
      onSearchFocus: vi.fn(),
      onClose: vi.fn(),
      onToggleShortcutsHelp: vi.fn(),
      onCycleAccount: vi.fn(),
      onJumpToAccount: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls onCycleAccount('prev') on Ctrl+Shift+[ keydown", () => {
    renderHook(() => useMailShortcuts(handlers));

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "[",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);
    });

    expect(handlers.onCycleAccount).toHaveBeenCalledWith("prev");
  });

  it("calls onCycleAccount('next') on Ctrl+Shift+] keydown", () => {
    renderHook(() => useMailShortcuts(handlers));

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "]",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);
    });

    expect(handlers.onCycleAccount).toHaveBeenCalledWith("next");
  });

  it("calls onJumpToAccount(0) on Ctrl+1 keydown", () => {
    renderHook(() => useMailShortcuts(handlers));

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "1",
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });
      window.dispatchEvent(event);
    });

    expect(handlers.onJumpToAccount).toHaveBeenCalledWith(0);
  });

  it("calls onJumpToAccount(8) on Ctrl+9 keydown", () => {
    renderHook(() => useMailShortcuts(handlers));

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "9",
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });
      window.dispatchEvent(event);
    });

    expect(handlers.onJumpToAccount).toHaveBeenCalledWith(8);
  });

  it("does not call onJumpToAccount for Ctrl+0", () => {
    renderHook(() => useMailShortcuts(handlers));

    act(() => {
      const event = new KeyboardEvent("keydown", {
        key: "0",
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });
      window.dispatchEvent(event);
    });

    expect(handlers.onJumpToAccount).not.toHaveBeenCalled();
  });

  it("does not trigger account switching when typing in an input", () => {
    renderHook(() => useMailShortcuts(handlers));

    act(() => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent("keydown", {
        key: "1",
        ctrlKey: true,
        bubbles: true,
      });
      input.dispatchEvent(event);

      document.body.removeChild(input);
    });

    expect(handlers.onJumpToAccount).not.toHaveBeenCalled();
    expect(handlers.onCycleAccount).not.toHaveBeenCalled();
  });
});
