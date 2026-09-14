/**
 * Unit tests for email pinning.
 */
import { describe, it, expect } from "vitest";
import {
  createPinState,
  isPinned,
  pinEmail,
  unpinEmail,
  togglePin,
  getPinnedEmails,
  getPinCount,
  isMaxPinsReached,
} from "@/lib/email-pinning";

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
    });
  });
});
