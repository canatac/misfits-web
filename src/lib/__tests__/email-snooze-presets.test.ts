import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  computeSnoozeUntil, deleteCustomSnoozePreset, getSnoozePresets,
  loadCustomSnoozePresets, saveCustomSnoozePreset, SNOOZE_PRESETS,
} from "@/lib/email-snooze-presets";

describe("email-snooze-presets", () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it("SNOOZE_PRESETS has 5 default entries", () => {
    expect(SNOOZE_PRESETS).toHaveLength(5);
    expect(SNOOZE_PRESETS[0].id).toBe("1h");
  });

  it("saveCustomSnoozePreset stores a user preset", () => {
    saveCustomSnoozePreset("user-1", { id: "2h", label: "2 hours", labelFr: "2 heures", durationMs: 7200000 });
    expect(loadCustomSnoozePresets("user-1")).toHaveLength(1);
    expect(loadCustomSnoozePresets("user-1")[0].id).toBe("2h");
  });

  it("loadCustomSnoozePresets returns only own user presets", () => {
    saveCustomSnoozePreset("user-1", { id: "2h", label: "2h", labelFr: "2h", durationMs: 7200000 });
    saveCustomSnoozePreset("user-2", { id: "4h", label: "4h", labelFr: "4h", durationMs: 14400000 });
    expect(loadCustomSnoozePresets("user-1")).toHaveLength(1);
    expect(loadCustomSnoozePresets("user-1")[0].id).toBe("2h");
  });

  it("deleteCustomSnoozePreset removes a preset", () => {
    saveCustomSnoozePreset("user-1", { id: "2h", label: "2h", labelFr: "2h", durationMs: 7200000 });
    deleteCustomSnoozePreset("user-1", "2h");
    expect(loadCustomSnoozePresets("user-1")).toHaveLength(0);
  });

  it("getSnoozePresets merges defaults with custom", () => {
    saveCustomSnoozePreset("user-1", { id: "2h", label: "2h", labelFr: "2h", durationMs: 7200000 });
    expect(getSnoozePresets("user-1")).toHaveLength(6);
  });

  it("computeSnoozeUntil returns future date for duration-based", () => {
    const now = new Date("2026-09-01T10:00:00.000Z");
    const until = computeSnoozeUntil(SNOOZE_PRESETS[0], now);
    expect(until.toISOString()).toBe("2026-09-01T11:00:00.000Z");
  });

  it("computeSnoozeUntil returns tomorrow 9am", () => {
    const now = new Date("2026-09-01T10:00:00.000Z");
    const until = computeSnoozeUntil(SNOOZE_PRESETS[2], now);
    expect(until.toISOString()).toBe("2026-09-02T09:00:00.000Z");
  });
});
