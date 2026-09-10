/**
 * Unit tests for thread depth indicators.
 */
import { describe, it, expect } from "vitest";
import {
  calculateIndent,
  getDepthLineStyles,
  getDepthAriaLabel,
  isMaxDepth,
  getCollapsedPreviewStyles,
  calculateVisualDepth,
  DEFAULT_CONFIG,
} from "@/lib/thread-depth";

describe("thread-depth", () => {
  describe("calculateIndent", () => {
    it("returns 0 for depth 0", () => {
      expect(calculateIndent(0)).toBe(0);
    });

    it("returns indent for depth 1", () => {
      expect(calculateIndent(1)).toBe(16);
    });

    it("returns indent for depth 2", () => {
      expect(calculateIndent(2)).toBe(32);
    });

    it("clamps to max indent", () => {
      expect(calculateIndent(10)).toBe(DEFAULT_CONFIG.maxIndent);
    });
  });

  describe("getDepthLineStyles", () => {
    it("returns styles for depth 0", () => {
      const styles = getDepthLineStyles(0, false);
      expect(styles.paddingLeft).toBe("8px");
    });

    it("returns styles for active message", () => {
      const styles = getDepthLineStyles(1, true);
      expect(styles.borderLeft).toContain("2px solid");
    });

    it("returns styles for inactive message", () => {
      const styles = getDepthLineStyles(1, false);
      expect(styles.borderLeft).toContain("2px solid");
    });
  });

  describe("getDepthAriaLabel", () => {
    it("returns original message label", () => {
      expect(getDepthAriaLabel(0)).toBe("Original message");
    });

    it("returns direct reply label", () => {
      expect(getDepthAriaLabel(1)).toBe("Direct reply");
    });

    it("returns depth label", () => {
      expect(getDepthAriaLabel(3)).toBe("Reply at depth 3");
    });
  });

  describe("isMaxDepth", () => {
    it("returns false for shallow depth", () => {
      expect(isMaxDepth(1)).toBe(false);
    });

    it("returns true for max depth", () => {
      expect(isMaxDepth(10)).toBe(true);
    });
  });

  describe("getCollapsedPreviewStyles", () => {
    it("returns dashed line styles", () => {
      const styles = getCollapsedPreviewStyles();
      expect(styles.borderLeft).toContain("dashed");
    });
  });

  describe("calculateVisualDepth", () => {
    it("returns 0 for first message", () => {
      expect(calculateVisualDepth([], 0)).toBe(0);
    });

    it("returns depth for reply", () => {
      expect(calculateVisualDepth([0], 1)).toBe(1);
    });
  });
});
