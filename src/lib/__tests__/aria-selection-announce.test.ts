import { describe, it, expect } from "vitest";
import { announceSelectionChange, announceSelectionCleared, announceSelectAll, announceDeselectAll, announceToggleResult, getLiveRegionProps } from "@/lib/aria-selection-announce";
describe("announceSelectionChange", () => {
  it("0 count", () => { expect(announceSelectionChange({ count: 0 })).toBe("Selection cleared."); });
  it("1 with label", () => { expect(announceSelectionChange({ count: 1, itemLabel: "Alice" })).toBe("Alice selected."); });
  it("plural", () => { expect(announceSelectionChange({ count: 5 })).toBe("5 items selected."); });
  it("falls back to plural", () => { expect(announceSelectionChange({ count: 3, itemLabel: "A" })).toBe("3 items selected."); });
});
describe("announceSelectionCleared", () => { it("cleared msg", () => { expect(announceSelectionCleared()).toBe("All items deselected."); }); });
describe("announceSelectAll", () => { it("select all", () => { expect(announceSelectAll(42)).toBe("All 42 items selected."); }); });
describe("announceDeselectAll", () => { it("deselect all", () => { expect(announceDeselectAll()).toBe("All items deselected."); }); });
describe("announceToggleResult", () => {
  it("selected with label", () => { expect(announceToggleResult(true, "E1")).toBe("E1 selected."); });
  it("deselected with label", () => { expect(announceToggleResult(false, "E1")).toBe("E1 deselected."); });
  it("generic select", () => { expect(announceToggleResult(true)).toBe("Item selected."); });
  it("generic deselect", () => { expect(announceToggleResult(false)).toBe("Item deselected."); });
});
describe("getLiveRegionProps", () => {
  it("polite default", () => { const p = getLiveRegionProps(); expect(p["aria-live"]).toBe("polite"); expect(p.role).toBe("status"); });
  it("assertive", () => { const p = getLiveRegionProps("assertive"); expect(p["aria-live"]).toBe("assertive"); expect(p.role).toBe("alert"); });
  it("aria-atomic", () => { expect(getLiveRegionProps()["aria-atomic"]).toBe(true); });
});
