/**
 * Unit tests for email-pinning.ts
 *
 * Covers: pinEmail, unpinEmail, togglePin, isEmailPinned, getPinnedEmails,
 * reorderPinned, clearAllPins, and the MAX_PINNED cap.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  pinEmail,
  unpinEmail,
  togglePin,
  isEmailPinned,
  getPinnedEmails,
  reorderPinned,
  clearAllPins,
} from "@/lib/email-pinning";

beforeEach(() => {
  localStorage.clear();
});

describe("pinEmail", () => {
  it("adds an email to the pinned list", () => {
    const result = pinEmail("email-1");
    expect(result).toEqual(["email-1"]);
    expect(getPinnedEmails()).toEqual(["email-1"]);
  });

  it("preserves insertion order", () => {
    pinEmail("email-1");
    pinEmail("email-2");
    pinEmail("email-3");
    expect(getPinnedEmails()).toEqual(["email-1", "email-2", "email-3"]);
  });

  it("does not duplicate if already pinned", () => {
    pinEmail("email-1");
    const result = pinEmail("email-1");
    expect(result).toEqual(["email-1"]);
    expect(getPinnedEmails()).toEqual(["email-1"]);
  });

  it("ignores empty string", () => {
    const result = pinEmail("");
    expect(result).toEqual([]);
  });

  it("caps at MAX_PINNED (50) and drops the oldest", () => {
    for (let i = 0; i < 55; i++) {
      pinEmail(`email-${i}`, getPinnedEmails());
    }
    const pinned = getPinnedEmails();
    expect(pinned.length).toBe(50);
    expect(pinned[0]).toBe("email-5");
    expect(pinned[49]).toBe("email-54");
  });
});

describe("unpinEmail", () => {
  it("removes a pinned email", () => {
    pinEmail("email-1");
    const result = unpinEmail("email-1");
    expect(result).toEqual([]);
    expect(getPinnedEmails()).toEqual([]);
  });

  it("no-op if email is not pinned", () => {
    const result = unpinEmail("email-ghost");
    expect(result).toEqual([]);
  });

  it("only removes the targeted email", () => {
    pinEmail("email-1");
    pinEmail("email-2");
    const result = unpinEmail("email-1");
    expect(result).toEqual(["email-2"]);
  });

  it("ignores empty string", () => {
    pinEmail("email-1");
    const result = unpinEmail("");
    expect(result).toEqual(["email-1"]);
  });
});

describe("togglePin", () => {
  it("pins when not pinned", () => {
    const result = togglePin("email-1");
    expect(result).toEqual(["email-1"]);
  });

  it("unpins when already pinned", () => {
    pinEmail("email-1");
    const result = togglePin("email-1");
    expect(result).toEqual([]);
  });
});

describe("isEmailPinned", () => {
  it("returns true for pinned email", () => {
    pinEmail("email-1");
    expect(isEmailPinned("email-1")).toBe(true);
  });

  it("returns false for unpinned email", () => {
    expect(isEmailPinned("email-1")).toBe(false);
  });
});

describe("reorderPinned", () => {
  beforeEach(() => {
    pinEmail("email-a");
    pinEmail("email-b");
    pinEmail("email-c");
  });

  it("moves an item forward", () => {
    const result = reorderPinned(0, 2);
    expect(result).toEqual(["email-b", "email-c", "email-a"]);
  });

  it("moves an item backward", () => {
    const result = reorderPinned(2, 0);
    expect(result).toEqual(["email-c", "email-a", "email-b"]);
  });

  it("no-op when fromIndex equals toIndex", () => {
    const result = reorderPinned(1, 1);
    expect(result).toEqual(["email-a", "email-b", "email-c"]);
  });

  it("no-op when indices are out of bounds", () => {
    expect(reorderPinned(-1, 1)).toEqual(["email-a", "email-b", "email-c"]);
    expect(reorderPinned(0, 5)).toEqual(["email-a", "email-b", "email-c"]);
  });

  it("persists the reorder", () => {
    reorderPinned(0, 2);
    expect(getPinnedEmails()).toEqual(["email-b", "email-c", "email-a"]);
  });
});

describe("clearAllPins", () => {
  it("removes all pinned emails", () => {
    pinEmail("email-1");
    pinEmail("email-2");
    clearAllPins();
    expect(getPinnedEmails()).toEqual([]);
  });

  it("works when nothing is pinned", () => {
    clearAllPins();
    expect(getPinnedEmails()).toEqual([]);
  });
});
