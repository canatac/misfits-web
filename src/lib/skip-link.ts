/**
 * Skip-to-content link (Issue #412).
 *
 * WCAG 2.4.1 compliant skip link for keyboard navigation.
 */

export interface SkipLinkConfig {
  targetId: string;
  linkText: string;
  className: string;
  focusClassName: string;
}

export const DEFAULT_CONFIG: SkipLinkConfig = {
  targetId: "main-content",
  linkText: "Skip to main content",
  className: "sr-only",
  focusClassName:
    "focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#C49B66] focus:text-black focus:rounded-lg focus:font-medium",
};

/**
 * Get skip link HTML attributes.
 */
export function getSkipLinkAttrs(config: SkipLinkConfig = DEFAULT_CONFIG): Record<string, string> {
  return {
    href: `#${config.targetId}`,
    className: `${config.className} ${config.focusClassName}`,
    "aria-label": config.linkText,
  };
}

/**
 * Get main content target attributes.
 */
export function getMainContentAttrs(config: SkipLinkConfig = DEFAULT_CONFIG): Record<string, string> {
  return {
    id: config.targetId,
    tabIndex: "-1",
    "aria-label": "Main content",
  };
}

/**
 * Check if target element exists.
 */
export function targetExists(config: SkipLinkConfig = DEFAULT_CONFIG): boolean {
  if (typeof document === "undefined") return false;
  return document.getElementById(config.targetId) !== null;
}

/**
 * Focus main content target.
 */
export function focusMainContent(config: SkipLinkConfig = DEFAULT_CONFIG): boolean {
  if (typeof document === "undefined") return false;
  const target = document.getElementById(config.targetId);
  if (target) {
    target.focus();
    return true;
  }
  return false;
}
