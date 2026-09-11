import { describe, it, expect } from "vitest";
import {
  getFilterTabs,
  isValidFilterTab,
  loadFilterTab,
  saveFilterTab,
  clearFilterTab,
  shouldShowIndicator,
  getTabLabel,
  DEFAULT_TAB,
} from "@/lib/filter-persistence";

describe("filter-persistence", () => {
  it("returns all filter tabs", () => {
    expect(getFilterTabs()).toEqual(["all", "unread", "attachments", "starred"]);
  });

  it("validates filter tab", () => {
    expect(isValidFilterTab("all")).toBe(true);
    expect(isValidFilterTab("invalid")).toBe(false);
  });

  it("loads default tab", () => {
    expect(loadFilterTab()).toBe(DEFAULT_TAB);
  });

  it("saves and loads tab", () => {
    saveFilterTab("unread");
    expect(loadFilterTab()).toBe("unread");
    clearFilterTab();
  });

  it("clears tab", () => {
    saveFilterTab("unread");
    clearFilterTab();
    expect(loadFilterTab()).toBe(DEFAULT_TAB);
  });

  it("checks indicator", () => {
    expect(shouldShowIndicator("unread", "unread")).toBe(true);
    expect(shouldShowIndicator(null, "all")).toBe(false);
    expect(shouldShowIndicator("unread", "all")).toBe(false);
  });

  it("gets tab label", () => {
    expect(getTabLabel("all")).toBe("Focus");
    expect(getTabLabel("unread")).toBe("Non lus");
  });
});
