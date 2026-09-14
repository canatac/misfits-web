/**
 * focus-visible.ts — accessible focus-visibility helpers for misfits.ai Mail.
 *
 * Provides a centralized focus-visible ring class + SSR-safe detection of
 * keyboard-driven focus (vs. pointer clicks) so interactive elements can
 * render focus rings only when navigating via keyboard.
 *
 * Also provides focus ring utilities, focus traps, and accessibility helpers
 * for interactive elements (Issue #435).
 *
 * WCAG 2.4.7 compliant focus indicators using CSS custom properties.
 */
export const FOCUS_VISIBLE_RING_CLASS = "focus-visible-ring";

export type FocusVisibleInitOptions = {
  className?: string;
  /** CSS custom property name applied to the root when focus is keyboard-driven. */
  cssVar?: string;
};

const DEFAULT_CSS_VAR = "--focus-visible";

function safeDocument(): Document | null {
  if (typeof document === "undefined") return null;
  return document;
}

/**
 * Initialize the keyboard-focus detector.
 *
 * Adds `is-keyboard-focus` on <html> and `focus-visible-ring` on the active
 * element when focus was triggered by keyboard (Tab / Shift+Tab / arrow keys).
 * Pointer focus clears both.
 */
export function initFocusVisible(
  options: FocusVisibleInitOptions = {}
): () => void {
  const doc = safeDocument();
  if (!doc) return () => {};

  const ringClass = options.className ?? FOCUS_VISIBLE_RING_CLASS;
  const cssVar = options.cssVar ?? DEFAULT_CSS_VAR;
  let usingKeyboard = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab" || /^Arrow/.test(e.key)) {
      usingKeyboard = true;
      doc.documentElement.classList.add("is-keyboard-focus");
      document.documentElement.style.setProperty(cssVar, "1");
    }
  };

  const onPointerDown = () => {
    usingKeyboard = false;
    doc.documentElement.classList.remove("is-keyboard-focus");
    document.documentElement.style.removeProperty(cssVar);
  };

  const onFocusIn = () => {
    if (!usingKeyboard) return;
    const active = doc.activeElement;
    if (active && active instanceof HTMLElement) {
      active.classList.add(ringClass);
    }
  };

  const onFocusOut = () => {
    const active = doc.activeElement;
    if (active && active instanceof HTMLElement) {
      active.classList.remove(ringClass);
    }
  };

  doc.addEventListener("keydown", onKeyDown, true);
  doc.addEventListener("pointerdown", onPointerDown, true);
  doc.addEventListener("focusin", onFocusIn);
  doc.addEventListener("focusout", onFocusOut);

  return () => {
    doc.removeEventListener("keydown", onKeyDown, true);
    doc.removeEventListener("pointerdown", onPointerDown, true);
    doc.removeEventListener("focusin", onFocusIn);
    doc.removeEventListener("focusout", onFocusOut);
    doc.documentElement.classList.remove("is-keyboard-focus");
    doc.documentElement.style.removeProperty(cssVar);
  };
}

/** Returns true when keyboard-focus detection is active (test helper). */
export function isKeyboardFocusActive(): boolean {
  const doc = safeDocument();
  if (!doc) return false;
  return doc.documentElement.classList.contains("is-keyboard-focus");
}

export interface FocusConfig {
  color: string;
  width: number;
  offset: number;
  style: string;
}

export const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  color: "#C49B66",
  width: 2,
  offset: 2,
  style: "solid",
};

/**
 * Get focus ring CSS.
 */
export function getFocusRingCSS(config: FocusConfig = DEFAULT_FOCUS_CONFIG): string {
  return `
    outline: ${config.width}px ${config.style} ${config.color};
    outline-offset: ${config.offset}px;
    box-shadow: 0 0 0 ${config.width + 1}px ${config.color}40;
  `;
}

/**
 * Check if element is focusable.
 */
export function isFocusable(el: HTMLElement): boolean {
  const focusableSelectors = [
    "button",
    "input",
    "select",
    "textarea",
    "a[href]",
    "[tabindex]",
    "[contenteditable]",
  ];

  if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const tabindex = el.getAttribute("tabindex");
  if (tabindex && parseInt(tabindex, 10) < 0) {
    return false;
  }

  return focusableSelectors.some((sel) => el.matches(sel));
}

/**
 * Apply focus ring to element.
 */
export function applyFocusRing(
  el: HTMLElement,
  config: FocusConfig = DEFAULT_FOCUS_CONFIG,
): void {
  el.style.cssText += getFocusRingCSS(config);
}

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get focus transition duration based on user preference.
 */
export function getFocusTransition(preferReduced: boolean): string {
  return preferReduced ? "0s" : "0.2s ease-out";
}

/**
 * Create focus trap for a container element.
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    "[tabindex]:not([tabindex='-1'])",
  ].join(", ");

  function getFocusableElements(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return {
    activate() {
      container.addEventListener("keydown", handleKeyDown);
    },
    deactivate() {
      container.removeEventListener("keydown", handleKeyDown);
    },
  };
}
