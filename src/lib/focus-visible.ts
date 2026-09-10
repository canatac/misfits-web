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
 * Get CSS custom properties for focus.
 */
export function getFocusCSSVars(config: FocusConfig = DEFAULT_FOCUS_CONFIG): Record<string, string> {
  return {
    "--focus-color": config.color,
    "--focus-width": `${config.width}px`,
    "--focus-offset": `${config.offset}px`,
    "--focus-style": config.style,
  };
}

/**
 * Check if element is focusable.
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "[tabindex]:not([tabindex='-1'])",
  ];
  return element.matches(focusableSelectors.join(", "));
}

/**
 * Check if reduced motion is preferred.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
