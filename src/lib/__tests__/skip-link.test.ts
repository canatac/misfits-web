import { describe, it, expect } from "vitest";
import {
  getSkipLinkAttrs,
  getMainContentAttrs,
  targetExists,
  focusMainContent,
  DEFAULT_CONFIG,
} from "@/lib/skip-link";

describe("skip-link", () => {
  it("returns skip link attrs", () => {
    const attrs = getSkipLinkAttrs();
    expect(attrs.href).toBe("#main-content");
    expect(attrs.className).toContain("sr-only");
    expect(attrs["aria-label"]).toBe("Skip to main content");
  });

  it("returns main content attrs", () => {
    const attrs = getMainContentAttrs();
    expect(attrs.id).toBe("main-content");
    expect(attrs.tabIndex).toBe("-1");
  });

  it("checks target exists", () => {
    expect(targetExists()).toBe(false);
  });

  it("focuses main content", () => {
    expect(focusMainContent()).toBe(false);
  });
});
