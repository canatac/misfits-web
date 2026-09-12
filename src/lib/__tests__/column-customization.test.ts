import { beforeEach, describe, expect, it } from "vitest";
import {
  defaultPreferences,
  DEFAULT_COLUMNS,
  loadPreferences,
  normalizePrefs,
  resetPreferences,
  savePreferences,
} from "@/lib/column-customization";

declare let localStorage: Storage;

describe("column-customization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exposes default columns", () => {
    expect(DEFAULT_COLUMNS.length).toBeGreaterThanOrEqual(4);
    expect(defaultPreferences().visibleIds).toContain("from");
    expect(defaultPreferences().visibleIds).toContain("subject");
  });

  it("normalizes unknown column ids away", () => {
    const normalized = normalizePrefs({ visibleIds: ["from", "ghost"], widths: {} });
    expect(normalized.visibleIds).toEqual(["from"]);
    expect("ghost" in normalized.widths).toBe(false);
  });

  it("saves and loads round-trip", () => {
    const prefs = defaultPreferences();
    savePreferences(prefs);
    const loaded = loadPreferences();
    expect(loaded).toEqual(prefs);
  });

  it("reset removes stored prefs", () => {
    savePreferences({ visibleIds: ["from"], widths: {} });
    resetPreferences();
    expect(loadPreferences()).toEqual(defaultPreferences());
  });
});
