/**
 * Unit tests for shortcuts.
 */
import { describe, it, expect } from "vitest";
import {
  createShortcutState,
  getBinding,
  getBindingByShortcut,
  findConflicts,
  updateBinding,
  applyPreset,
  resetToDefault,
  exportBindings,
  importBindings,
  isValidShortcut,
  getBindingsByCategory,
  getCategories,
} from "@/lib/shortcuts";

describe("shortcuts", () => {
  describe("createShortcutState", () => {
    it("creates initial state", () => {
      const state = createShortcutState();
      expect(state.bindings.length).toBeGreaterThan(0);
      expect(state.activePreset).toBe("default");
    });
  });

  describe("getBinding", () => {
    it("returns binding for action", () => {
      const state = createShortcutState();
      const binding = getBinding(state, "compose");
      expect(binding).toBeDefined();
      expect(binding?.action).toBe("compose");
    });
  });

  describe("getBindingByShortcut", () => {
    it("returns binding for shortcut", () => {
      const state = createShortcutState();
      const binding = getBindingByShortcut(state, "c");
      expect(binding).toBeDefined();
      expect(binding?.shortcut).toBe("c");
    });
  });

  describe("findConflicts", () => {
    it("returns conflicts", () => {
      const state = createShortcutState();
      const conflicts = findConflicts(state, "c");
      expect(conflicts).toHaveLength(1);
    });

    it("excludes action", () => {
      const state = createShortcutState();
      const conflicts = findConflicts(state, "c", "compose");
      expect(conflicts).toHaveLength(0);
    });
  });

  describe("updateBinding", () => {
    it("updates shortcut", () => {
      let state = createShortcutState();
      state = updateBinding(state, "compose", "x");
      expect(getBinding(state, "compose")?.shortcut).toBe("x");
    });
  });

  describe("applyPreset", () => {
    it("applies preset", () => {
      let state = createShortcutState();
      state = applyPreset(state, "gmail");
      expect(state.activePreset).toBe("gmail");
    });
  });

  describe("resetToDefault", () => {
    it("resets to default", () => {
      let state = createShortcutState();
      state = applyPreset(state, "gmail");
      state = resetToDefault(state);
      expect(state.activePreset).toBe("default");
    });
  });

  describe("exportBindings", () => {
    it("exports JSON", () => {
      const state = createShortcutState();
      const json = exportBindings(state);
      const parsed = JSON.parse(json);
      expect(parsed).toBeInstanceOf(Array);
    });
  });

  describe("importBindings", () => {
    it("imports JSON", () => {
      let state = createShortcutState();
      const json = exportBindings(state);
      state = importBindings(state, json);
      expect(state.bindings.length).toBeGreaterThan(0);
    });
  });

  describe("isValidShortcut", () => {
    it("allows valid shortcut", () => {
      expect(isValidShortcut("ctrl+enter")).toBe(true);
    });

    it("forbids system shortcut", () => {
      expect(isValidShortcut("ctrl+w")).toBe(false);
    });
  });

  describe("getBindingsByCategory", () => {
    it("filters by category", () => {
      const state = createShortcutState();
      const navBindings = getBindingsByCategory(state, "Navigation");
      expect(navBindings.length).toBeGreaterThan(0);
    });
  });

  describe("getCategories", () => {
    it("returns categories", () => {
      const state = createShortcutState();
      const categories = getCategories(state);
      expect(categories).toContain("Navigation");
    });
  });
});
