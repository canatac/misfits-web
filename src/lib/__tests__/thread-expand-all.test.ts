import { describe, it, expect } from "vitest";
import { computeExpandAll, allExpanded, allCollapsed, toggleThread, applyExpandAll } from "@/lib/thread-expand-all";

const ids = ["t1", "t2", "t3"];

describe("computeExpandAll", () => {
  it("expands all", () => { expect(computeExpandAll(ids, "expand", false)).toEqual({ t1: true, t2: true, t3: true }); });
  it("collapses all", () => { expect(computeExpandAll(ids, "collapse", true)).toEqual({ t1: false, t2: false, t3: false }); });
  it("toggles from collapsed", () => { expect(computeExpandAll(ids, "toggle", false)).toEqual({ t1: true, t2: true, t3: true }); });
  it("toggles from expanded", () => { expect(computeExpandAll(ids, "toggle", true)).toEqual({ t1: false, t2: false, t3: false }); });
  it("handles empty ids", () => { expect(computeExpandAll([], "expand", false)).toEqual({}); });
});
describe("allExpanded", () => {
  it("true when all expanded", () => { expect(allExpanded({ t1: true, t2: true })).toBe(true); });
  it("false when some collapsed", () => { expect(allExpanded({ t1: true, t2: false })).toBe(false); });
  it("false for empty", () => { expect(allExpanded({})).toBe(false); });
});
describe("allCollapsed", () => {
  it("true when all collapsed", () => { expect(allCollapsed({ t1: false, t2: false })).toBe(true); });
  it("false when some expanded", () => { expect(allCollapsed({ t1: true, t2: false })).toBe(false); });
  it("false for empty", () => { expect(allCollapsed({})).toBe(false); });
});
describe("toggleThread", () => {
  it("toggles existing", () => { expect(toggleThread({ t1: true, t2: false }, "t2")).toEqual({ t1: true, t2: true }); });
  it("adds new as expanded", () => { expect(toggleThread({ t1: true }, "t2")).toEqual({ t1: true, t2: true }); });
  it("does not mutate input", () => { const s = { t1: true }; toggleThread(s, "t2"); expect(s).toEqual({ t1: true }); });
});
describe("applyExpandAll", () => {
  it("merges expand into existing", () => { expect(applyExpandAll({ t1: true, t2: false }, ["t2", "t3"], "expand")).toEqual({ t1: true, t2: true, t3: true }); });
  it("preserves other entries", () => { expect(applyExpandAll({ t1: true, t2: false, t4: true }, ["t2"], "collapse")).toEqual({ t1: true, t2: false, t4: true }); });
});
