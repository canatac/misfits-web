import { describe, it, expect } from "vitest";
import { computeDepth, buildPrefix, computeAllDepths, depthClass, ThreadMessage } from "@/lib/thread-depth-indicators";
const thread: ThreadMessage[] = [
  { id: "1", parentId: null }, { id: "2", parentId: "1" }, { id: "3", parentId: "1" },
  { id: "4", parentId: "2" }, { id: "5", parentId: "4" }, { id: "6", parentId: "5" },
];
describe("computeDepth", () => {
  it("root level 0", () => { expect(computeDepth(thread[0], thread).level).toBe(0); });
  it("nested level 2", () => { expect(computeDepth(thread[3], thread).level).toBe(2); });
  it("caps at MAX_INDENT", () => { const d: ThreadMessage[] = [{id:"1",parentId:null},{id:"2",parentId:"1"},{id:"3",parentId:"2"},{id:"4",parentId:"3"},{id:"5",parentId:"4"},{id:"6",parentId:"5"},{id:"7",parentId:"6"}]; expect(computeDepth(d[6], d).level).toBe(4); expect(computeDepth(d[6], d).isDeep).toBe(true); });
  it("missing parent", () => { const o: ThreadMessage = { id: "x", parentId: "missing" }; expect(computeDepth(o, [...thread, o]).level).toBe(0); });
  it("cycle guard", () => { const c: ThreadMessage[] = [{id:"1",parentId:"2"},{id:"2",parentId:"1"}]; expect(computeDepth(c[0], c).level).toBeLessThan(10); });
});
describe("buildPrefix", () => {
  it("empty for level 0", () => { expect(buildPrefix(0, false)).toBe(""); });
  it("├ for not last", () => { expect(buildPrefix(1, false)).toBe("├ "); });
  it("└ for last", () => { expect(buildPrefix(1, true)).toBe("└ "); });
  it("nested", () => { expect(buildPrefix(2, false)).toBe("│ ├ "); });
});
describe("computeAllDepths", () => {
  it("returns all", () => { const r = computeAllDepths(thread); expect(Object.keys(r)).toHaveLength(thread.length); });
  it("root level 0", () => { expect(computeAllDepths(thread)["1"].level).toBe(0); });
  it("siblings same level", () => { const r = computeAllDepths(thread); expect(r["2"].level).toBe(1); expect(r["3"].level).toBe(1); });
});
describe("depthClass", () => { it("clamps", () => { expect(depthClass(0)).toBe("thread-depth-0"); expect(depthClass(10)).toBe("thread-depth-4"); }); });
