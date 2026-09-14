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
  createPinState,
  isPinned,
  getPinCount,
  isMaxPinsReached,
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


  describe("email-pinning", () => {
  describe("createPinState", () => {
    it("creates empty state", () => {
      const state = createPinState();
      expect(state.pinned).toEqual([]);
      expect(state.maxPins).toBe(10);
    });
  });

  describe("isPinned", () => {
    it("returns false when not pinned", () => {
      const state = createPinState();
      expect(isPinned(state, "email1")).toBe(false);
    });

    it("returns true when pinned", () => {
      let state = createPinState();
      state = pinEmail(state, "email1");
      expect(isPinned(state, "email1")).toBe(true);
    });
  });

  describe("pinEmail", () => {
    it("pins an email", () => {
      let state = createPinState();
      state = pinEmail(state, "email1");
      expect(getPinCount(state)).toBe(1);
    });

    it("does not duplicate pin", () => {
      let state = createPinState();
      state = pinEmail(state, "email1");
      state = pinEmail(state, "email1");
      expect(getPinCount(state)).toBe(1);
    });
  });

  describe("unpinEmail", () => {
    it("unpins an email", () => {
      let state = createPinState();
      state = pinEmail(state, "email1");
      state = unpinEmail(state, "email1");
      expect(getPinCount(state)).toBe(0);
    });
  });

  describe("togglePin", () => {
    it("toggles pin on", () => {
      let state = createPinState();
      state = togglePin(state, "email1");
      expect(isPinned(state, "email1")).toBe(true);
    });

    it("toggles pin off", () => {
      let state = createPinState();
      state = pinEmail(state, "email1");
      state = togglePin(state, "email1");
      expect(isPinned(state, "email1")).toBe(false);
    });
  });

  describe("getPinnedEmails", () => {
    it("returns pinned email ids", () => {
      let state = createPinState();
      state = pinEmail(state, "email1");
      state = pinEmail(state, "email2");
      expect(getPinnedEmails(state)).toEqual(["email1", "email2"]);
    });
  });

  describe("getPinCount", () => {
    it("returns count", () => {
      let state = createPinState();
      expect(getPinCount(state)).toBe(0);
      state = pinEmail(state, "email1");
      expect(getPinCount(state)).toBe(1);
    });
  });

  describe("isMaxPinsReached", () => {
    it("returns false when under max", () => {
      const state = createPinState(2);
      expect(isMaxPinsReached(state)).toBe(false);
    });

    it("returns true when at max", () => {
      let state = createPinState(2);
      state = pinEmail(state, "email1");
      state = pinEmail(state, "email2");
      expect(isMaxPinsReached(state)).toBe(true);

