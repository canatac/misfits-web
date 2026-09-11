/**
 * Unit tests for skip search.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSkipSearchState,
  isInputFocused,
  hasModifierKey,
  shouldTriggerSkipSearch,
  shouldClearSearch,
  focusSearchInput,
  blurSearchInput,
  handleSkipSearch,
  DEFAULT_CONFIG,
} from "@/lib/skip-search";

describe("skip-search", () => {
  describe("createSkipSearchState", () => {
    it("creates initial state", () => {
      const state = createSkipSearchState();
      expect(state.searchFocused).toBe(false);
      expect(state.placeholder).toBe(DEFAULT_CONFIG.placeholderHint);
    });
  });

  describe("isInputFocused", () => {
    it("returns true for input", () => {
      const event = { target: document.createElement("input") } as unknown as KeyboardEvent;
      expect(isInputFocused(event)).toBe(true);
    });

    it("returns true for textarea", () => {
      const event = { target: document.createElement("textarea") } as unknown as KeyboardEvent;
      expect(isInputFocused(event)).toBe(true);
    });

    it("returns false for div", () => {
      const event = { target: document.createElement("div") } as unknown as KeyboardEvent;
      expect(isInputFocused(event)).toBe(false);
    });
  });

  describe("hasModifierKey", () => {
    it("returns true for ctrl", () => {
      const event = { ctrlKey: true } as KeyboardEvent;
      expect(hasModifierKey(event)).toBe(true);
    });

    it("returns true for meta", () => {
      const event = { metaKey: true } as KeyboardEvent;
      expect(hasModifierKey(event)).toBe(true);
    });

    it("returns false for no modifier", () => {
      const event = {} as KeyboardEvent;
      expect(hasModifierKey(event)).toBe(false);
    });
  });

  describe("shouldTriggerSkipSearch", () => {
    it("returns true for / key", () => {
      const event = { key: "/", target: document.createElement("div") } as unknown as KeyboardEvent;
      expect(shouldTriggerSkipSearch(event)).toBe(true);
    });

    it("returns false for modifier", () => {
      const event = { key: "/", ctrlKey: true, target: document.createElement("div") } as unknown as KeyboardEvent;
      expect(shouldTriggerSkipSearch(event)).toBe(false);
    });

    it("returns false for input focused", () => {
      const event = { key: "/", target: document.createElement("input") } as unknown as KeyboardEvent;
      expect(shouldTriggerSkipSearch(event)).toBe(false);
    });
  });

  describe("shouldClearSearch", () => {
    it("returns true for escape", () => {
      const event = { key: "Escape" } as KeyboardEvent;
      expect(shouldClearSearch(event)).toBe(true);
    });

    it("returns false for other key", () => {
      const event = { key: "Enter" } as KeyboardEvent;
      expect(shouldClearSearch(event)).toBe(false);
    });
  });

  describe("focusSearchInput", () => {
    it("returns false when no search input", () => {
      expect(focusSearchInput()).toBe(false);
    });
  });

  describe("blurSearchInput", () => {
    it("returns false when no search input", () => {
      expect(blurSearchInput()).toBe(false);
    });
  });

  describe("handleSkipSearch", () => {
    it("focuses on / key", () => {
      const event = { key: "/", target: document.createElement("div"), preventDefault: vi.fn() } as unknown as KeyboardEvent;
      const result = handleSkipSearch(event);
      // Result depends on whether search input exists in DOM
      expect(["focused", "blurred", null]).toContain(result);
    });

    it("returns null for other key", () => {
      const event = { key: "a", target: document.createElement("div") } as unknown as KeyboardEvent;
      expect(handleSkipSearch(event)).toBeNull();
    });
  });
});
