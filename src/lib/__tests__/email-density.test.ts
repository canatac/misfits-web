/**
 * Unit tests for email density setting.
 */
import { describe, it, expect } from "vitest";
import {
  getDensityConfig,
  getRowHeight,
  getDensityCSSVars,
  loadDensity,
  saveDensity,
  isValidDensity,
  getDensityOptions,
  getMobileDensity,
  DEFAULT_DENSITY,
} from "@/lib/email-density";

describe("email-density", () => {
  describe("getDensityConfig", () => {
    it("returns compact config", () => {
      const config = getDensityConfig("compact");
      expect(config.rowHeight).toBe(32);
    });

    it("returns comfortable config", () => {
      const config = getDensityConfig("comfortable");
      expect(config.rowHeight).toBe(48);
    });

    it("returns spacious config", () => {
      const config = getDensityConfig("spacious");
      expect(config.rowHeight).toBe(64);
    });
  });

  describe("getRowHeight", () => {
    it("returns compact row height", () => {
      expect(getRowHeight("compact")).toBe(32);
    });

    it("returns spacious row height", () => {
      expect(getRowHeight("spacious")).toBe(64);
    });
  });

  describe("getDensityCSSVars", () => {
    it("returns CSS variables", () => {
      const vars = getDensityCSSVars("compact");
      expect(vars["--email-row-height"]).toBe("32px");
      expect(vars["--email-font-size"]).toBe("12px");
    });
  });

  describe("loadDensity", () => {
    it("returns default density when no stored value", () => {
      expect(loadDensity()).toBe(DEFAULT_DENSITY);
    });
  });

  describe("saveDensity", () => {
    it("saves density to localStorage", () => {
      saveDensity("compact");
      expect(loadDensity()).toBe("compact");
      saveDensity(DEFAULT_DENSITY);
    });
  });

  describe("isValidDensity", () => {
    it("returns true for valid density", () => {
      expect(isValidDensity("compact")).toBe(true);
      expect(isValidDensity("comfortable")).toBe(true);
      expect(isValidDensity("spacious")).toBe(true);
    });

    it("returns false for invalid density", () => {
      expect(isValidDensity("invalid")).toBe(false);
    });
  });

  describe("getDensityOptions", () => {
    it("returns all density options", () => {
      const options = getDensityOptions();
      expect(options).toHaveLength(3);
    });
  });

  describe("getMobileDensity", () => {
    it("returns spacious for mobile", () => {
      expect(getMobileDensity()).toBe("spacious");
    });
  });
});
