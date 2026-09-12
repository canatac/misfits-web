/**
 * Unit tests for prefetch-arrow-nav.ts
 *
 * Covers: registerArrowNavPrefetch, navigateDown, navigateUp,
 * handleArrowKeyNav, getCurrentIndex, getCurrentEmailId, unregister.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  registerArrowNavPrefetch,
  unregisterArrowNavPrefetch,
  navigateDown,
  navigateUp,
  handleArrowKeyNav,
  getCurrentIndex,
  getCurrentEmailId,
} from "@/lib/prefetch-arrow-nav";

const EMAILS = ["email-1", "email-2", "email-3", "email-4", "email-5"];

function makeKeyNav(key: string): KeyboardEvent {
  return new KeyboardEvent("keydown", { key });
}

beforeEach(() => {
  unregisterArrowNavPrefetch();
});

describe("registerArrowNavPrefetch", () => {
  it("registers state and allows navigation", () => {
    const prefetch = vi.fn();
    registerArrowNavPrefetch(EMAILS, prefetch, 0);
    expect(getCurrentIndex()).toBe(0);
    expect(getCurrentEmailId()).toBe("email-1");
  });

  it("prefetches the next-next item on navigateDown", () => {
    const prefetch = vi.fn();
    registerArrowNavPrefetch(EMAILS, prefetch, 0);
    navigateDown();
    expect(prefetch).toHaveBeenCalledWith("email-3");
  });
});

describe("navigateDown", () => {
  it("moves to the next email", () => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 0);
    const id = navigateDown();
    expect(id).toBe("email-2");
    expect(getCurrentIndex()).toBe(1);
  });

  it("stops at the last email", () => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 4);
    const id = navigateDown();
    expect(id).toBe("email-5");
    expect(getCurrentIndex()).toBe(4);
  });

  it("prefetches two ahead", () => {
    const prefetch = vi.fn();
    registerArrowNavPrefetch(EMAILS, prefetch, 1);
    navigateDown();
    expect(getCurrentEmailId()).toBe("email-3");
    expect(prefetch).toHaveBeenCalledWith("email-4");
  });

  it("does not prefetch past the end", () => {
    const prefetch = vi.fn();
    registerArrowNavPrefetch(EMAILS, prefetch, 3);
    navigateDown();
    // nextIndex=4, prefetchIndex=4 (same, skip)
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("returns null when not registered", () => {
    expect(navigateDown()).toBeNull();
  });

  it("returns null for empty list", () => {
    registerArrowNavPrefetch([], vi.fn(), 0);
    expect(navigateDown()).toBeNull();
  });
});

describe("navigateUp", () => {
  it("moves to the previous email", () => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 2);
    const id = navigateUp();
    expect(id).toBe("email-2");
    expect(getCurrentIndex()).toBe(1);
  });

  it("stops at the first email", () => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 0);
    const id = navigateUp();
    expect(id).toBe("email-1");
    expect(getCurrentIndex()).toBe(0);
  });

  it("prefetches two back", () => {
    const prefetch = vi.fn();
    registerArrowNavPrefetch(EMAILS, prefetch, 3);
    navigateUp();
    expect(getCurrentEmailId()).toBe("email-3");
    expect(prefetch).toHaveBeenCalledWith("email-1");
  });

  it("does not prefetch before start", () => {
    const prefetch = vi.fn();
    registerArrowNavPrefetch(EMAILS, prefetch, 1);
    navigateUp();
    // nextIndex=0, prefetchIndex=0 (same, skip)
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("returns null when not registered", () => {
    expect(navigateUp()).toBeNull();
  });
});

describe("handleArrowKeyNav", () => {
  beforeEach(() => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 2);
  });

  it("handles 'j' as down", () => {
    expect(handleArrowKeyNav(makeKeyNav("j"))).toBe("email-4");
  });

  it("handles 'ArrowDown' as down", () => {
    expect(handleArrowKeyNav(makeKeyNav("ArrowDown"))).toBe("email-5");
  });

  it("handles 'k' as up", () => {
    expect(handleArrowKeyNav(makeKeyNav("k"))).toBe("email-4");
  });

  it("handles 'ArrowUp' as up", () => {
    expect(handleArrowKeyNav(makeKeyNav("ArrowUp"))).toBe("email-3");
  });

  it("ignores unrelated keys", () => {
    expect(handleArrowKeyNav(makeKeyNav("x"))).toBeNull();
    expect(handleArrowKeyNav(makeKeyNav("Enter"))).toBeNull();
  });

  it("returns null when not registered", () => {
    unregisterArrowNavPrefetch();
    expect(handleArrowKeyNav(makeKeyNav("j"))).toBeNull();
  });
});

describe("getCurrentIndex", () => {
  it("returns the current index", () => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 3);
    expect(getCurrentIndex()).toBe(3);
  });

  it("returns -1 when not registered", () => {
    expect(getCurrentIndex()).toBe(-1);
  });
});

describe("getCurrentEmailId", () => {
  it("returns the current email ID", () => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 2);
    expect(getCurrentEmailId()).toBe("email-3");
  });

  it("returns null when not registered", () => {
    expect(getCurrentEmailId()).toBeNull();
  });
});

describe("unregisterArrowNavPrefetch", () => {
  it("clears state", () => {
    registerArrowNavPrefetch(EMAILS, vi.fn(), 2);
    unregisterArrowNavPrefetch();
    expect(getCurrentIndex()).toBe(-1);
    expect(navigateDown()).toBeNull();
  });
});
