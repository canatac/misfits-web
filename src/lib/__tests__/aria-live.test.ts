import { describe, it, expect } from "vitest";
import {
  ariaLiveReducer,
  initialState,
  addToast,
  removeToast,
  clearToasts,
  getToastCount,
  hasErrorToasts,
  getLiveRegion,
  getContextMessage,
} from "@/lib/aria-live";

describe("aria-live", () => {
  it("creates empty state", () => {
    expect(initialState.toasts).toEqual([]);
    expect(initialState.liveRegion).toBe("polite");
  });

  it("adds toast", () => {
    const state = ariaLiveReducer(initialState, addToast("Archived"));
    expect(getToastCount(state)).toBe(1);
  });

  it("adds error toast", () => {
    const state = ariaLiveReducer(initialState, addToast("Failed", "alert"));
    expect(state.liveRegion).toBe("assertive");
  });

  it("removes toast", () => {
    let state = ariaLiveReducer(initialState, addToast("Test"));
    const toastId = state.toasts[0].id;
    state = ariaLiveReducer(state, removeToast(toastId));
    expect(getToastCount(state)).toBe(0);
  });

  it("clears all", () => {
    let state = ariaLiveReducer(initialState, addToast("Test"));
    state = ariaLiveReducer(state, clearToasts());
    expect(getToastCount(state)).toBe(0);
  });

  it("checks error toasts", () => {
    const state = ariaLiveReducer(initialState, addToast("Error", "alert"));
    expect(hasErrorToasts(state)).toBe(true);
  });

  it("gets live region", () => {
    expect(getLiveRegion("status")).toBe("polite");
    expect(getLiveRegion("alert")).toBe("assertive");
  });

  it("gets context message", () => {
    expect(getContextMessage("Archived", "Meeting notes")).toBe("Archived: Meeting notes");
  });
});
