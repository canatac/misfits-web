/**
 * Focus visible on interactive elements (Issue #435).
 *
 * WCAG 2.4.7 compliant focus indicators using CSS custom properties.
 */

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
