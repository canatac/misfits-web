/**
 * Unit tests for snooze presets.
 */
import { describe, it, expect } from "vitest";
import {
  getSnoozePresetById,
  getSnoozePresetByShortcut,
  calculateSnoozeTime,
  isEmailSnoozed,
  getRemainingSnoozeMinutes,
  snoozeEmail,
  unsnoozeEmail,
  getSnoozePresets,
  formatSnoozeDuration,
  shouldShowSnoozeMenu,
} from "@/lib/snooze-presets";

describe("snooze-presets", () => {
  describe("getSnoozePresetById", () => {
    it("returns preset by id", () => {
      const preset = getSnoozePresetById("later-today");
      expect(preset).toBeDefined();
      expect(preset?.id).toBe("later-today");
    });

    it("returns undefined for unknown id", () => {
      const preset = getSnoozePresetById("unknown");
      expect(preset).toBeUndefined();
    });
  });

  describe("getSnoozePresetByShortcut", () => {
    it("returns preset by shortcut", () => {
      const preset = getSnoozePresetByShortcut("1");
      expect(preset).toBeDefined();
      expect(preset?.shortcut).toBe("1");
    });

    it("returns undefined for unknown shortcut", () => {
      const preset = getSnoozePresetByShortcut("9");
      expect(preset).toBeUndefined();
    });
  });

  describe("calculateSnoozeTime", () => {
    it("calculates snooze time", () => {
      const preset = getSnoozePresetById("later-today")!;
      const time = calculateSnoozeTime(preset);
      expect(time).toBeInstanceOf(Date);
      expect(time.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("isEmailSnoozed", () => {
    it("returns false when not snoozed", () => {
      expect(isEmailSnoozed(null)).toBe(false);
    });

    it("returns true when snoozed", () => {
      const future = new Date(Date.now() + 60000);
      expect(isEmailSnoozed(future)).toBe(true);
    });

    it("returns false when snooze expired", () => {
      const past = new Date(Date.now() - 60000);
      expect(isEmailSnoozed(past)).toBe(false);
    });
  });

  describe("getRemainingSnoozeMinutes", () => {
    it("returns 0 when not snoozed", () => {
      expect(getRemainingSnoozeMinutes(null)).toBe(0);
    });

    it("returns remaining minutes", () => {
      const future = new Date(Date.now() + 60000);
      const remaining = getRemainingSnoozeMinutes(future);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(1);
    });
  });

  describe("snoozeEmail", () => {
    it("snoozes email", () => {
      const preset = getSnoozePresetById("later-today")!;
      const result = snoozeEmail("email1", preset);
      expect(result.emailId).toBe("email1");
      expect(result.snoozedUntil).toBeInstanceOf(Date);
      expect(result.preset).toEqual(preset);
    });
  });

  describe("unsnoozeEmail", () => {
    it("unsnoozes email", () => {
      const result = unsnoozeEmail("email1");
      expect(result.emailId).toBe("email1");
      expect(result.snoozedUntil).toBeNull();
    });
  });

  describe("getSnoozePresets", () => {
    it("returns all presets", () => {
      const presets = getSnoozePresets();
      expect(presets).toHaveLength(4);
    });
  });

  describe("formatSnoozeDuration", () => {
    it("formats minutes", () => {
      const preset = getSnoozePresetById("later-today")!;
      expect(formatSnoozeDuration(preset)).toBe("2h");
    });

    it("formats days", () => {
      const preset = getSnoozePresetById("next-week")!;
      expect(formatSnoozeDuration(preset)).toBe("7d");
    });
  });

  describe("shouldShowSnoozeMenu", () => {
    it("returns true when email selected", () => {
      expect(shouldShowSnoozeMenu("email1")).toBe(true);
    });

    it("returns false when no email selected", () => {
      expect(shouldShowSnoozeMenu(null)).toBe(false);
    });
  });
});
