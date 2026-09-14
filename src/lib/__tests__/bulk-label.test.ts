import { describe, it, expect } from "vitest";
import {
  createBulkLabelState,
  openBulkLabel,
  closeBulkLabel,
  toggleLabel,
  isLabelSelected,
  getSelectedLabelCount,
  getSelectedLabelIds,
  isBulkLabelOpen,
  hasSelectedEmails,
  getEmailCount,
  getSuccessMessage,
} from "@/lib/bulk-label";

describe("bulk-label", () => {
  it("creates empty state", () => {
    const s = createBulkLabelState();
    expect(s.isOpen).toBe(false);
    expect(s.selectedLabels.size).toBe(0);
  });

  it("opens with emails", () => {
    let s = createBulkLabelState();
    s = openBulkLabel(s, ["e1", "e2"]);
    expect(s.isOpen).toBe(true);
    expect(getEmailCount(s)).toBe(2);
  });

  it("closes", () => {
    let s = openBulkLabel(createBulkLabelState(), ["e1"]);
    s = closeBulkLabel(s);
    expect(s.isOpen).toBe(false);
  });

  it("toggles label", () => {
    let s = openBulkLabel(createBulkLabelState(), ["e1"]);
    s = toggleLabel(s, "l1");
    expect(isLabelSelected(s, "l1")).toBe(true);
    s = toggleLabel(s, "l1");
    expect(isLabelSelected(s, "l1")).toBe(false);
  });

  it("gets selected count", () => {
    let s = openBulkLabel(createBulkLabelState(), ["e1"]);
    s = toggleLabel(s, "l1");
    s = toggleLabel(s, "l2");
    expect(getSelectedLabelCount(s)).toBe(2);
  });

  it("gets selected IDs", () => {
    let s = openBulkLabel(createBulkLabelState(), ["e1"]);
    s = toggleLabel(s, "l1");
    expect(getSelectedLabelIds(s)).toEqual(["l1"]);
  });

  it("checks open", () => {
    expect(isBulkLabelOpen(createBulkLabelState())).toBe(false);
  });

  it("checks emails", () => {
    let s = openBulkLabel(createBulkLabelState(), ["e1"]);
    expect(hasSelectedEmails(s)).toBe(true);
  });

  it("gets email count", () => {
    let s = openBulkLabel(createBulkLabelState(), ["e1", "e2"]);
    expect(getEmailCount(s)).toBe(2);
  });

  it("gets success message", () => {
    let s = openBulkLabel(createBulkLabelState(), ["e1", "e2"]);
    s = toggleLabel(s, "l1");
    expect(getSuccessMessage(s)).toContain("applied to 2 emails");
  });
});
