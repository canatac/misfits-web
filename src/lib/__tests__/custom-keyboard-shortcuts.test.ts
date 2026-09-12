import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SHORTCUTS, findActionForKey, getEffectiveShortcuts,
  loadCustomShortcuts, resetAllShortcuts, resetShortcut,
  saveCustomShortcuts, serializeShortcut, setShortcutOverride,
} from "@/lib/custom-keyboard-shortcuts";

describe("custom-keyboard-shortcuts", () => {
  beforeEach(() => { localStorage.clear(); resetAllShortcuts(); });
  afterEach(() => { localStorage.clear(); resetAllShortcuts(); });

  it("DEFAULT_SHORTCUTS contains expected actions", () => {
    expect(DEFAULT_SHORTCUTS.compose).toBeDefined();
    expect(DEFAULT_SHORTCUTS.pin).toBeDefined();
    expect(DEFAULT_SHORTCUTS.snooze).toBeDefined();
  });

  it("getEffectiveShortcuts returns defaults with no overrides", () => {
    const map = getEffectiveShortcuts();
    expect(map.compose.key).toBe("c");
    expect(map.search.key).toBe("/");
  });

  it("setShortcutOverride persists to localStorage", () => {
    setShortcutOverride("compose", { key: "x", description: "Compose" });
    expect(loadCustomShortcuts().compose?.key).toBe("x");
  });

  it("getEffectiveShortcuts merges overrides", () => {
    setShortcutOverride("compose", { key: "x", description: "Compose" });
    const map = getEffectiveShortcuts();
    expect(map.compose.key).toBe("x");
    expect(map.reply.key).toBe("r");
  });

  it("resetShortcut removes an override", () => {
    setShortcutOverride("compose", { key: "x", description: "Compose" });
    resetShortcut("compose");
    expect(getEffectiveShortcuts().compose.key).toBe("c");
  });

  it("resetAllShortcuts clears all overrides", () => {
    setShortcutOverride("compose", { key: "x", description: "Compose" });
    resetAllShortcuts();
    expect(loadCustomShortcuts()).toEqual({});
  });

  it("serializeShortcut produces readable labels", () => {
    expect(serializeShortcut({ key: "Enter", meta: true, description: "Send" })).toBe("Meta+Enter");
    expect(serializeShortcut({ key: " ", ctrl: true, description: "Test" })).toBe("Ctrl+Space");
    expect(serializeShortcut({ key: "/", description: "Search" })).toBe("/");
  });

  it("findActionForKey returns action for default shortcut", () => {
    expect(findActionForKey("p")).toBe("pin");
  });

  it("findActionForKey respects modifiers", () => {
    expect(findActionForKey("a", { meta: true, shift: true })).toBe("replyAll");
  });

  it("findActionForKey returns null when no match", () => {
    expect(findActionForKey("z")).toBeNull();
  });
});
