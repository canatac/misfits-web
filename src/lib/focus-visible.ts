/**
 * focus-visible.ts — accessible focus-visibility helpers for misfits.ai Mail.
 *
 * Provides a centralized focus-visible ring class + SSR-safe detection of
 * keyboard-driven focus (vs. pointer clicks) so interactive elements can
 * render focus rings only when navigating via keyboard.
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
