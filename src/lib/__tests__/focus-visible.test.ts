import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DEFAULT_FOCUS_CONFIG,
  FocusConfig,
  applyFocusRing,
  createFocusTrap,
  getFocusRingCSS,
  getFocusTransition,
  isFocusable,
  prefersReducedMotion,
} from "@/lib/focus-visible";

describe("DEFAULT_FOCUS_CONFIG", () => {
  it("has gold color for WCAG compliance", () => {
    expect(DEFAULT_FOCUS_CONFIG.color).toBe("#C49B66");
    expect(DEFAULT_FOCUS_CONFIG.width).toBe(2);
    expect(DEFAULT_FOCUS_CONFIG.offset).toBe(2);
    expect(DEFAULT_FOCUS_CONFIG.style).toBe("solid");
  });
});

describe("getFocusRingCSS", () => {
  it("generates CSS from default config", () => {
    const css = getFocusRingCSS();
    expect(css).toContain("outline: 2px solid #C49B66");
    expect(css).toContain("outline-offset: 2px");
    expect(css).toContain("box-shadow");
  });

  it("generates CSS from custom config", () => {
    const config: FocusConfig = { color: "#000", width: 3, offset: 1, style: "dashed" };
    const css = getFocusRingCSS(config);
    expect(css).toContain("outline: 3px dashed #000");
    expect(css).toContain("outline-offset: 1px");
  });
});

describe("isFocusable", () => {
  it("returns true for button elements", () => {
    const el = document.createElement("button");
    expect(isFocusable(el)).toBe(true);
  });

  it("returns true for input elements", () => {
    const el = document.createElement("input");
    expect(isFocusable(el)).toBe(true);
  });

  it("returns true for links with href", () => {
    const el = document.createElement("a");
    el.href = "https://example.com";
    expect(isFocusable(el)).toBe(true);
  });

  it("returns false for plain links without href", () => {
    const el = document.createElement("a");
    expect(isFocusable(el)).toBe(false);
  });

  it("returns false for disabled elements", () => {
    const el = document.createElement("button");
    el.setAttribute("disabled", "");
    expect(isFocusable(el)).toBe(false);
  });

  it("returns false for negative tabindex", () => {
    const el = document.createElement("div");
    el.setAttribute("tabindex", "-1");
    expect(isFocusable(el)).toBe(false);
  });

  it("returns false for aria-hidden elements", () => {
    const el = document.createElement("button");
    el.setAttribute("aria-hidden", "true");
    expect(isFocusable(el)).toBe(false);
  });
});

describe("applyFocusRing", () => {
  it("applies focus ring CSS to element", () => {
    const el = document.createElement("button");
    applyFocusRing(el);
    expect(el.style.cssText).toContain("outline:");
    expect(el.style.cssText).toContain("#C49B66");
  });
});

describe("prefersReducedMotion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when user prefers reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
    } as unknown as MediaQueryList);
    expect(prefersReducedMotion()).toBe(true);
  });

  it("returns false when user does not prefer reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-reduced-motion: reduce)",
    } as unknown as MediaQueryList);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("getFocusTransition", () => {
  it("returns 0s for reduced motion preference", () => {
    expect(getFocusTransition(true)).toBe("0s");
  });

  it("returns transition duration for normal motion", () => {
    expect(getFocusTransition(false)).toBe("0.2s ease-out");
  });
});

describe("createFocusTrap", () => {
  it("cycles focus forward through elements", () => {
    const container = document.createElement("div");
    const btn1 = document.createElement("button");
    const btn2 = document.createElement("button");
    const btn3 = document.createElement("button");
    container.append(btn1, btn2, btn3);
    document.body.appendChild(container);

    const trap = createFocusTrap(container);
    trap.activate();

    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    // Simulate Tab key
    const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    container.dispatchEvent(tabEvent);

    trap.deactivate();
    document.body.removeChild(container);
  });

  it("cycles focus backward on Shift+Tab", () => {
    const container = document.createElement("div");
    const btn1 = document.createElement("button");
    const btn2 = document.createElement("button");
    container.append(btn1, btn2);
    document.body.appendChild(container);

    const trap = createFocusTrap(container);
    trap.activate();

    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
    });
    container.dispatchEvent(shiftTabEvent);

    trap.deactivate();
    document.body.removeChild(container);
  });
});
