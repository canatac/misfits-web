/**
 * Unit tests for email-snooze-presets.ts
 *
 * Covers: getSnoozePresets, getPresetById, formatSnoozeDuration,
 * resolveSnoozeTimestamp, findPresetByOffset.
 */
import { describe, it, expect } from "vitest";
import {
  getSnoozePresets,
  getPresetById,
  formatSnoozeDuration,
  resolveSnoozeTimestamp,
  findPresetByOffset,
  SNOOZE_PRESETS,
} from "@/lib/email-snooze-presets";

describe("getSnoozePresets", () => {
  it("returns all presets in order", () => {
    const presets = getSnoozePresets();
    expect(presets).toHaveLength(SNOOZE_PRESETS.length);
    expect(presets.map((p) => p.id)).toEqual([
      "1hour",
      "tomorrow",
      "3days",
      "1week",
      "2weeks",
      "1month",
    ]);
  });

  it("orders presets from shortest to longest", () => {
    const presets = getSnoozePresets();
    for (let i = 1; i < presets.length; i++) {
      expect(presets[i].offsetMs).toBeGreaterThan(presets[i - 1].offsetMs);
    }
  });
});

describe("getPresetById", () => {
  it("returns the preset for a known ID", () => {
    expect(getPresetById("1hour")?.offsetMs).toBe(60 * 60 * 1000);
    expect(getPresetById("1week")?.label).toBe("Next week");
  });

  it("returns undefined for unknown ID", () => {
    expect(getPresetById("nonexistent")).toBeUndefined();
  });
});

describe("formatSnoozeDuration", () => {
  it("formats minutes", () => {
    expect(formatSnoozeDuration(5 * 60_000)).toBe("5 minutes");
    expect(formatSnoozeDuration(1 * 60_000)).toBe("1 minute");
  });

  it("formats hours", () => {
    expect(formatSnoozeDuration(60 * 60_000)).toBe("1 hour");
    expect(formatSnoozeDuration(3 * 60 * 60_000)).toBe("3 hours");
  });

  it("formats days", () => {
    expect(formatSnoozeDuration(24 * 60 * 60_000)).toBe("1 day");
    expect(formatSnoozeDuration(3 * 24 * 60 * 60_000)).toBe("3 days");
  });

  it("formats weeks", () => {
    expect(formatSnoozeDuration(7 * 24 * 60 * 60_000)).toBe("1 week");
    expect(formatSnoozeDuration(14 * 24 * 60 * 60_000)).toBe("2 weeks");
  });

  it("formats months", () => {
    expect(formatSnoozeDuration(30 * 24 * 60 * 60_000)).toBe("1 month");
  });

  it("returns 'Invalid duration' for non-positive offsets", () => {
    expect(formatSnoozeDuration(0)).toBe("Invalid duration");
    expect(formatSnoozeDuration(-1000)).toBe("Invalid duration");
  });

  it("formats seconds for sub-minute durations", () => {
    expect(formatSnoozeDuration(30_000)).toBe("30 seconds");
  });
});

describe("resolveSnoozeTimestamp", () => {
  it("computes future timestamp from a preset", () => {
    const from = 1_000_000_000_000;
    const ts = resolveSnoozeTimestamp("1hour", from);
    expect(ts).toBe(from + 60 * 60 * 1000);
  });

  it("returns undefined for unknown preset", () => {
    expect(resolveSnoozeTimestamp("nonexistent")).toBeUndefined();
  });

  it("uses Date.now() by default", () => {
    const before = Date.now();
    const ts = resolveSnoozeTimestamp("1hour");
    const after = Date.now();
    expect(ts!).toBeGreaterThanOrEqual(before + 60 * 60 * 1000);
    expect(ts!).toBeLessThanOrEqual(after + 60 * 60 * 1000);
  });
});

describe("findPresetByOffset", () => {
  it("returns the matching preset", () => {
    expect(findPresetByOffset(60 * 60 * 1000)?.id).toBe("1hour");
    expect(findPresetByOffset(7 * 24 * 60 * 60_1000)?.id).toBeUndefined();
  });

  it("returns undefined for non-preset offsets", () => {
    expect(findPresetByOffset(12345)).toBeUndefined();
  });
});
