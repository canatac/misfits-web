/**
 * Unit tests for custom-keyboard-shortcuts.ts
 *
 * Covers: normalizeKeyEvent, matchesShortcut, registerShortcut,
 * unregisterShortcut, dispatchShortcut, getActiveShortcuts, clearShortcuts.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  normalizeKeyEvent,
  matchesShortcut,
  registerShortcut,
  unregisterShortcut,
  dispatchShortcut,
  getActiveShortcuts,
  clearShortcuts,
  type ShortcutDefinition,
} from "@/lib/custom-keyboard-shortcuts";

function makeKeyEvent(init: Partial<KeyboardEvent>): KeyboardEvent {
  return new KeyboardEvent("keydown", init);
}

beforeEach(() => {
  clearShortcuts();
});

describe("normalizeKeyEvent", () => {
  it("normalizes ctrl+shift+p", () => {
    const event = makeKeyEvent({ key: "p", ctrlKey: true, shiftKey: true });
    expect(normalizeKeyEvent(event)).toBe("ctrl+shift+p");
  });

  it("normalizes plain letter", () => {
    const event = makeKeyEvent({ key: "A" });
    expect(normalizeKeyEvent(event)).toBe("a");
  });

  it("orders modifiers consistently", () => {
    const event = makeKeyEvent({
      key: "k",
      shiftKey: true,
      ctrlKey: true,
      altKey: true,
      metaKey: true,
    });
    expect(normalizeKeyEvent(event)).toBe("ctrl+alt+shift+meta+k");
  });

  it("maps arrow keys", () => {
    expect(normalizeKeyEvent(makeKeyEvent({ key: "ArrowUp" }))).toBe("up");
    expect(normalizeKeyEvent(makeKeyEvent({ key: "ArrowDown" }))).toBe("down");
  });

  it("maps space", () => {
    expect(normalizeKeyEvent(makeKeyEvent({ key: " " }))).toBe("space");
  });

  it("maps Escape to esc", () => {
    expect(normalizeKeyEvent(makeKeyEvent({ key: "Escape" }))).toBe("esc");
  });

  it("ignores lone modifier key presses", () => {
    expect(normalizeKeyEvent(makeKeyEvent({ key: "Control", ctrlKey: true }))).toBe("ctrl");
    expect(normalizeKeyEvent(makeKeyEvent({ key: "Shift", shiftKey: true }))).toBe("shift");
  });
});

describe("matchesShortcut", () => {
  it("returns true for matching combo", () => {
    const event = makeKeyEvent({ key: "p", ctrlKey: true, shiftKey: true });
    expect(matchesShortcut(event, "ctrl+shift+p")).toBe(true);
  });

  it("is case-insensitive", () => {
    const event = makeKeyEvent({ key: "P", ctrlKey: true });
    expect(matchesShortcut(event, "Ctrl+P")).toBe(true);
  });

  it("returns false for non-matching combo", () => {
    const event = makeKeyEvent({ key: "p", ctrlKey: true });
    expect(matchesShortcut(event, "ctrl+shift+p")).toBe(false);
  });
});

describe("registerShortcut", () => {
  it("registers and retrieves a shortcut", () => {
    const def: ShortcutDefinition = { combo: "ctrl+k", handler: () => {} };
    registerShortcut(def);
    expect(getActiveShortcuts()).toHaveLength(1);
  });

  it("replaces existing shortcut with same combo", () => {
    registerShortcut({ combo: "ctrl+k", handler: () => {} });
    registerShortcut({ combo: "ctrl+k", handler: () => {}, allowInInput: true });
    const active = getActiveShortcuts();
    expect(active).toHaveLength(1);
    expect(active[0].allowInInput).toBe(true);
  });

  it("stores combo case-insensitively", () => {
    registerShortcut({ combo: "Ctrl+Shift+P", handler: () => {} });
    expect(getActiveShortcuts()).toHaveLength(1);
  });
});

describe("unregisterShortcut", () => {
  it("removes a registered shortcut", () => {
    registerShortcut({ combo: "ctrl+k", handler: () => {} });
    unregisterShortcut("ctrl+k");
    expect(getActiveShortcuts()).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    registerShortcut({ combo: "ctrl+k", handler: () => {} });
    unregisterShortcut("CTRL+K");
    expect(getActiveShortcuts()).toHaveLength(0);
  });

  it("no-op when combo not registered", () => {
    expect(() => unregisterShortcut("ctrl+z")).not.toThrow();
  });
});

describe("dispatchShortcut", () => {
  it("invokes the matching handler", () => {
    const handler = vi.fn();
    registerShortcut({ combo: "ctrl+k", handler });
    const event = makeKeyEvent({ key: "k", ctrlKey: true });
    expect(dispatchShortcut(event)).toBe(true);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("returns false when no match", () => {
    const event = makeKeyEvent({ key: "x" });
    expect(dispatchShortcut(event)).toBe(false);
  });

  it("blocks input-scope shortcuts when target is an input", () => {
    const handler = vi.fn();
    registerShortcut({ combo: "ctrl+k", handler });
    const input = document.createElement("input");
    document.body.appendChild(input);
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    Object.defineProperty(event, "target", { value: input });
    expect(dispatchShortcut(event)).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("allows input-scope shortcuts when allowInInput is true", () => {
    const handler = vi.fn();
    registerShortcut({ combo: "ctrl+k", handler, allowInInput: true });
    const input = document.createElement("input");
    document.body.appendChild(input);
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    Object.defineProperty(event, "target", { value: input });
    expect(dispatchShortcut(event)).toBe(true);
    expect(handler).toHaveBeenCalled();
    document.body.removeChild(input);
  });
});

describe("getActiveShortcuts", () => {
  it("returns empty array when none registered", () => {
    expect(getActiveShortcuts()).toEqual([]);
  });

  it("returns all registered shortcuts", () => {
    registerShortcut({ combo: "ctrl+a", handler: () => {} });
    registerShortcut({ combo: "ctrl+b", handler: () => {} });
    expect(getActiveShortcuts()).toHaveLength(2);
  });
});

describe("clearShortcuts", () => {
  it("removes all registered shortcuts", () => {
    registerShortcut({ combo: "ctrl+a", handler: () => {} });
    registerShortcut({ combo: "ctrl+b", handler: () => {} });
    clearShortcuts();
    expect(getActiveShortcuts()).toHaveLength(0);
  });
});
