/**
 * Unit tests for settings navigation.
 */
import { describe, it, expect } from "vitest";
import {
  getSettingsSections,
  getSectionById,
  getDefaultSection,
  isSectionActive,
  getSectionByPath,
} from "@/lib/settings-nav";

describe("settings-nav", () => {
  describe("getSettingsSections", () => {
    it("returns all sections", () => {
      const sections = getSettingsSections();
      expect(sections).toHaveLength(6);
    });
  });

  describe("getSectionById", () => {
    it("returns section", () => {
      const section = getSectionById("general");
      expect(section?.id).toBe("general");
    });

    it("returns undefined for unknown", () => {
      expect(getSectionById("unknown")).toBeUndefined();
    });
  });

  describe("getDefaultSection", () => {
    it("returns general", () => {
      expect(getDefaultSection().id).toBe("general");
    });
  });

  describe("isSectionActive", () => {
    it("returns true for active section", () => {
      const section = getSectionById("general")!;
      expect(isSectionActive(section, "/settings/general")).toBe(true);
    });

    it("returns false for inactive", () => {
      const section = getSectionById("general")!;
      expect(isSectionActive(section, "/settings/notifications")).toBe(false);
    });
  });

  describe("getSectionByPath", () => {
    it("returns section for path", () => {
      const section = getSectionByPath("/settings/general");
      expect(section?.id).toBe("general");
    });

    it("returns undefined for unknown path", () => {
      expect(getSectionByPath("/unknown")).toBeUndefined();
    });
  });
});
