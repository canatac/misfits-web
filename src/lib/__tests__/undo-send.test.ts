/**
 * Unit tests for undo send utility.
 */
import { describe, it, expect } from "vitest";
import {
  createUndoSendState,
  getRemainingMs,
  getRemainingSeconds,
  isUndoWindowActive,
  isUndoWindowExpired,
  cancelSend,
  getUndoWindowMs,
  getUndoWindowSeconds,
  formatRemainingTime,
} from "@/lib/undo-send";

describe("undo-send", () => {
  describe("createUndoSendState", () => {
    it("creates state with 5 second window", () => {
      const state = createUndoSendState("e1");
      expect(state.emailId).toBe("e1");
      expect(state.isCancelled).toBe(false);
      expect(state.isExpired).toBe(false);
      expect(state.remainingSeconds).toBe(5);
    });
  });

  describe("getRemainingMs", () => {
    it("returns positive time for new state", () => {
      const state = createUndoSendState("e1");
      expect(getRemainingMs(state)).toBeGreaterThan(0);
      expect(getRemainingMs(state)).toBeLessThanOrEqual(5000);
    });
  });

  describe("getRemainingSeconds", () => {
    it("returns 5 for new state", () => {
      const state = createUndoSendState("e1");
      expect(getRemainingSeconds(state)).toBe(5);
    });
  });

  describe("isUndoWindowActive", () => {
    it("returns true for new state", () => {
      const state = createUndoSendState("e1");
      expect(isUndoWindowActive(state)).toBe(true);
    });

    it("returns false for cancelled state", () => {
      const state = createUndoSendState("e1");
      state.isCancelled = true;
      expect(isUndoWindowActive(state)).toBe(false);
    });
  });

  describe("isUndoWindowExpired", () => {
    it("returns false for new state", () => {
      const state = createUndoSendState("e1");
      expect(isUndoWindowExpired(state)).toBe(false);
    });

    it("returns true for expired state", () => {
      const state = createUndoSendState("e1");
      state.expiresAt = new Date(Date.now() - 1000).toISOString();
      expect(isUndoWindowExpired(state)).toBe(true);
    });
  });

  describe("cancelSend", () => {
    it("succeeds within window", () => {
      const state = createUndoSendState("e1");
      const result = cancelSend(state);
      expect(result.success).toBe(true);
      expect(result.restoredToDrafts).toBe(true);
    });

    it("fails after expiry", () => {
      const state = createUndoSendState("e1");
      state.expiresAt = new Date(Date.now() - 1000).toISOString();
      const result = cancelSend(state);
      expect(result.success).toBe(false);
    });

    it("fails if already cancelled", () => {
      const state = createUndoSendState("e1");
      state.isCancelled = true;
      const result = cancelSend(state);
      expect(result.success).toBe(false);
    });
  });

  describe("getUndoWindowMs", () => {
    it("returns 5000", () => {
      expect(getUndoWindowMs()).toBe(5000);
    });
  });

  describe("getUndoWindowSeconds", () => {
    it("returns 5", () => {
      expect(getUndoWindowSeconds()).toBe(5);
    });
  });

  describe("formatRemainingTime", () => {
    it("formats with suffix", () => {
      const state = createUndoSendState("e1");
      expect(formatRemainingTime(state)).toMatch(/^\d+s$/);
    });
  });
});
