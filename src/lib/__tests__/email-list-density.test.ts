import { describe, it, expect } from "vitest";
import { getDensityConfig, densityStyles, parseDensityMode, cycleDensity, visibleRows, DENSITY_CONFIGS, DensityMode } from "@/lib/email-list-density";
describe("getDensityConfig", () => {
  it("compact", () => { const c = getDensityConfig("compact"); expect(c.rowHeight).toBe(36); expect(c.showPreview).toBe(false); });
  it("default", () => { const c = getDensityConfig("default"); expect(c.rowHeight).toBe(56); });
  it("comfortable", () => { const c = getDensityConfig("comfortable"); expect(c.rowHeight).toBe(72); });
});
describe("DENSITY_CONFIGS", () => { it("all modes", () => { expect(Object.keys(DENSITY_CONFIGS).sort()).toEqual(["comfortable","compact","default"]); }); });
describe("densityStyles", () => { it("css vars", () => { const s = densityStyles(getDensityConfig("compact")); expect(s["--email-row-height"]).toBe("36px"); }); });
describe("parseDensityMode", () => {
  it("valid", () => { expect(parseDensityMode("compact")).toBe("compact"); expect(parseDensityMode("default")).toBe("default"); });
  it("invalid", () => { expect(parseDensityMode("invalid")).toBe("default"); expect(parseDensityMode(undefined)).toBe("default"); expect(parseDensityMode(null)).toBe("default"); });
});
describe("cycleDensity", () => {
  it("compact->default", () => { expect(cycleDensity("compact")).toBe("default"); });
  it("default->comfortable", () => { expect(cycleDensity("default")).toBe("comfortable"); });
  it("comfortable->compact", () => { expect(cycleDensity("comfortable")).toBe("compact"); });
});
describe("visibleRows", () => {
  it("calculates", () => { expect(visibleRows(600, 60)).toBe(10); });
  it("zero row height", () => { expect(visibleRows(600, 0)).toBe(0); });
  it("floors", () => { expect(visibleRows(100, 30)).toBe(3); });
});
