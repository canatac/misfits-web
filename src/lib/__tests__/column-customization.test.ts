/**
 * Unit tests for email list column customization.
 */
import { describe, it, expect } from "vitest";
import {
  getDefaultColumns,
  loadColumnCustomization,
  saveColumnCustomization,
  toggleColumn,
  resetColumns,
  getVisibleColumns,
  getMobileColumns,
  isColumnVisible,
  updateColumnVisibility,
  getVisibleColumnCount,
} from "@/lib/column-customization";

describe("column-customization", () => {
  describe("getDefaultColumns", () => {
    it("returns default columns", () => {
      const columns = getDefaultColumns();
      expect(columns).toHaveLength(8);
      expect(columns[0].id).toBe("checkbox");
    });
  });

  describe("loadColumnCustomization", () => {
    it("returns defaults when no storage", () => {
      const customization = loadColumnCustomization();
      expect(customization.columns).toHaveLength(8);
    });
  });

  describe("saveColumnCustomization", () => {
    it("saves to localStorage", () => {
      const customization = loadColumnCustomization();
      saveColumnCustomization(customization);
      expect(localStorage.getItem("misfits-email-columns")).toBeDefined();
    });
  });

  describe("toggleColumn", () => {
    it("toggles visibility", () => {
      const columns = getDefaultColumns();
      const toggled = toggleColumn(columns, "labels");
      expect(toggled[6].visible).toBe(true);
    });
  });

  describe("resetColumns", () => {
    it("resets to defaults", () => {
      const columns = getDefaultColumns();
      const toggled = toggleColumn(columns, "labels");
      const reset = resetColumns();
      expect(reset[6].visible).toBe(false);
    });
  });

  describe("getVisibleColumns", () => {
    it("returns only visible columns", () => {
      const columns = getDefaultColumns();
      const visible = getVisibleColumns(columns);
      expect(visible.length).toBe(6);
    });
  });

  describe("getMobileColumns", () => {
    it("returns essential columns for mobile", () => {
      const columns = getDefaultColumns();
      const mobile = getMobileColumns(columns);
      expect(mobile.length).toBe(5);
    });
  });

  describe("isColumnVisible", () => {
    it("returns true for visible column", () => {
      const columns = getDefaultColumns();
      expect(isColumnVisible(columns, "sender")).toBe(true);
    });

    it("returns false for hidden column", () => {
      const columns = getDefaultColumns();
      expect(isColumnVisible(columns, "labels")).toBe(false);
    });
  });

  describe("updateColumnVisibility", () => {
    it("updates visibility", () => {
      const columns = getDefaultColumns();
      const updated = updateColumnVisibility(columns, "labels", true);
      expect(updated[6].visible).toBe(true);
    });
  });

  describe("getVisibleColumnCount", () => {
    it("returns correct count", () => {
      const columns = getDefaultColumns();
      expect(getVisibleColumnCount(columns)).toBe(6);
    });
  });
});
