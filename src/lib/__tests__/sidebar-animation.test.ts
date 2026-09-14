/**
 * Unit tests for sidebar collapse/expand animation.
 */
import { describe, it, expect } from "vitest";
import {
  getSidebarTransitionClasses,
  getSidebarTransitionStyles,
  prefersReducedMotionEnabled,
  createSidebarState,
  toggleSidebar,
  setSidebarCollapsed,
  completeAnimation,
  getSidebarWidth,
  isSidebarCollapsed,
  DEFAULT_CONFIG,
} from "@/lib/sidebar-animation";

describe("sidebar-animation", () => {
  describe("getSidebarTransitionClasses", () => {
    it("returns expanded classes", () => {
      const classes = getSidebarTransitionClasses(false, true);
      expect(classes).toContain("w-64");
      expect(classes).toContain("opacity-100");
    });

    it("returns collapsed classes", () => {
      const classes = getSidebarTransitionClasses(true, true);
      expect(classes).toContain("w-0");
      expect(classes).toContain("opacity-0");
    });
  });

  describe("getSidebarTransitionStyles", () => {
    it("returns expanded styles", () => {
      const styles = getSidebarTransitionStyles(false);
      expect(styles.width).toBe(256);
      expect(styles.opacity).toBe(1);
    });

    it("returns collapsed styles", () => {
      const styles = getSidebarTransitionStyles(true);
      expect(styles.width).toBe(0);
      expect(styles.opacity).toBe(0);
    });

    it("includes GPU acceleration", () => {
      const styles = getSidebarTransitionStyles(false);
      expect(styles.transform).toBe("translateZ(0)");
    });
  });

  describe("createSidebarState", () => {
    it("creates expanded state", () => {
      const state = createSidebarState(false);
      expect(state.collapsed).toBe(false);
      expect(state.width).toBe(256);
    });

    it("creates collapsed state", () => {
      const state = createSidebarState(true);
      expect(state.collapsed).toBe(true);
      expect(state.width).toBe(0);
    });
  });

  describe("toggleSidebar", () => {
    it("toggles to collapsed", () => {
      const state = createSidebarState(false);
      const toggled = toggleSidebar(state);
      expect(toggled.collapsed).toBe(true);
      expect(toggled.width).toBe(0);
    });

    it("toggles to expanded", () => {
      const state = createSidebarState(true);
      const toggled = toggleSidebar(state);
      expect(toggled.collapsed).toBe(false);
      expect(toggled.width).toBe(256);
    });
  });

  describe("setSidebarCollapsed", () => {
    it("sets collapsed", () => {
      const state = createSidebarState(false);
      const collapsed = setSidebarCollapsed(state, true);
      expect(collapsed.collapsed).toBe(true);
    });
  });

  describe("completeAnimation", () => {
    it("marks animation complete", () => {
      const state = toggleSidebar(createSidebarState(false));
      const completed = completeAnimation(state);
      expect(completed.animating).toBe(false);
    });
  });

  describe("getSidebarWidth", () => {
    it("returns width", () => {
      const state = createSidebarState(false);
      expect(getSidebarWidth(state)).toBe(256);
    });
  });

  describe("isSidebarCollapsed", () => {
    it("returns collapsed state", () => {
      const state = createSidebarState(true);
      expect(isSidebarCollapsed(state)).toBe(true);
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("has correct defaults", () => {
      expect(DEFAULT_CONFIG.duration).toBe(200);
      expect(DEFAULT_CONFIG.easing).toBe("ease-out");
      expect(DEFAULT_CONFIG.respectReducedMotion).toBe(true);
    });
  });
});
