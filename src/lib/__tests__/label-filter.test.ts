import { describe, it, expect } from "vitest";
import {
  labelFilterReducer,
  initialState,
  setLabelFilter,
  clearLabelFilter,
  dismissBanner,
  isLabelActive,
  hasActiveFilter,
  getActiveLabelId,
  getActiveLabelName,
  isBannerVisible,
  emailMatchesLabel,
} from "@/lib/label-filter";

describe("label-filter", () => {
  it("creates empty state", () => {
    expect(initialState.activeLabelId).toBeNull();
    expect(initialState.filterBannerVisible).toBe(false);
  });

  it("sets filter", () => {
    const state = labelFilterReducer(initialState, setLabelFilter("l1", "Work"));
    expect(state.activeLabelId).toBe("l1");
    expect(state.activeLabelName).toBe("Work");
    expect(state.filterBannerVisible).toBe(true);
  });

  it("clears filter", () => {
    let state = labelFilterReducer(initialState, setLabelFilter("l1", "Work"));
    state = labelFilterReducer(state, clearLabelFilter());
    expect(state.activeLabelId).toBeNull();
    expect(state.filterBannerVisible).toBe(false);
  });

  it("dismisses banner", () => {
    let state = labelFilterReducer(initialState, setLabelFilter("l1", "Work"));
    state = labelFilterReducer(state, dismissBanner());
    expect(state.filterBannerVisible).toBe(false);
    expect(state.activeLabelId).toBe("l1");
  });

  it("checks label active", () => {
    const state = labelFilterReducer(initialState, setLabelFilter("l1", "Work"));
    expect(isLabelActive(state, "l1")).toBe(true);
    expect(isLabelActive(state, "l2")).toBe(false);
  });

  it("checks active filter", () => {
    expect(hasActiveFilter(initialState)).toBe(false);
    const state = labelFilterReducer(initialState, setLabelFilter("l1", "Work"));
    expect(hasActiveFilter(state)).toBe(true);
  });

  it("gets active label ID", () => {
    const state = labelFilterReducer(initialState, setLabelFilter("l1", "Work"));
    expect(getActiveLabelId(state)).toBe("l1");
  });

  it("gets active label name", () => {
    const state = labelFilterReducer(initialState, setLabelFilter("l1", "Work"));
    expect(getActiveLabelName(state)).toBe("Work");
  });

  it("checks banner visible", () => {
    expect(isBannerVisible(initialState)).toBe(false);
  });

  it("email matches label", () => {
    expect(emailMatchesLabel(["l1", "l2"], {}, "e1", "l1")).toBe(true);
    expect(emailMatchesLabel(["l2"], { e1: ["l1"] }, "e1", "l1")).toBe(true);
    expect(emailMatchesLabel(["l2"], {}, "e1", "l1")).toBe(false);
    expect(emailMatchesLabel(["l1"], {}, "e1", null)).toBe(true);
  });
});
