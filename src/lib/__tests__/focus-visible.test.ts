/**
 * Unit tests for focus visible.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import {
  getFocusRingCSS,
  getFocusCSSVars,
  isFocusable,
  prefersReducedMotion,
  DEFAULT_FOCUS_CONFIG,
} from "@/lib/focus-visible";

describe("focus-visible", () => {
  describe("getFocusRingCSS", () => {
    it("returns CSS string", () => {
      const css = getFocusRingCSS();
      expect(css).toContain("outline");
      expect(css).toContain("box-shadow");
    });

    it("includes config values", () => {
      const css = getFocusRingCSS(DEFAULT_FOCUS_CONFIG);
      expect(css).toContain(DEFAULT_FOCUS_CONFIG.color);
    });
  });

  describe("getFocusCSSVars", () => {
    it("returns CSS variables", () => {
      const vars = getFocusCSSVars();
      expect(vars["--focus-color"]).toBe(DEFAULT_FOCUS_CONFIG.color);
      expect(vars["--focus-width"]).toBe(`${DEFAULT_FOCUS_CONFIG.width}px`);
    });
  });

  describe("isFocusable", () => {
    it("returns true for button", () => {
      const button = document.createElement("button");
      expect(isFocusable(button)).toBe(true);
    });

    it("returns true for link", () => {
      const link = document.createElement("a");
      link.href = "#";
      expect(isFocusable(link)).toBe(true);
    });

    it("returns false for div", () => {
      const div = document.createElement("div");
      expect(isFocusable(div)).toBe(false);
    });
  });

  describe("prefersReducedMotion", () => {
    it("returns boolean", () => {
      expect(typeof prefersReducedMotion()).toBe("boolean");
    });
  });
});
