/**
 * Unit tests for error boundary.
 */
import { describe, it, expect } from "vitest";
import {
  errorBoundaryReducer,
  initialState,
  setError,
  clearError,
  toggleDetails,
  hasError,
  getErrorMessage,
  getErrorStack,
  isDetailsVisible,
  getErrorDetails,
} from "@/lib/error-boundary";

describe("error-boundary", () => {
  describe("errorBoundaryReducer", () => {
    it("handles SET_ERROR action", () => {
      const error = new Error("Test error");
      const state = errorBoundaryReducer(initialState, setError(error));
      expect(state.hasError).toBe(true);
      expect(state.error).toEqual(error);
    });

    it("handles CLEAR_ERROR action", () => {
      let state = errorBoundaryReducer(initialState, setError(new Error("Test")));
      state = errorBoundaryReducer(state, clearError());
      expect(state.hasError).toBe(false);
      expect(state.error).toBeNull();
    });

    it("handles TOGGLE_DETAILS action", () => {
      const state = errorBoundaryReducer(initialState, toggleDetails());
      expect(state.showDetails).toBe(true);
    });
  });

  describe("setError", () => {
    it("creates set error action", () => {
      const error = new Error("Test");
      const action = setError(error, "Info");
      expect(action.type).toBe("SET_ERROR");
      expect(action.payload?.error).toEqual(error);
      expect(action.payload?.errorInfo).toBe("Info");
    });
  });

  describe("clearError", () => {
    it("creates clear error action", () => {
      const action = clearError();
      expect(action.type).toBe("CLEAR_ERROR");
    });
  });

  describe("toggleDetails", () => {
    it("creates toggle details action", () => {
      const action = toggleDetails();
      expect(action.type).toBe("TOGGLE_DETAILS");
    });
  });

  describe("hasError", () => {
    it("returns false initially", () => {
      expect(hasError(initialState)).toBe(false);
    });

    it("returns true when error", () => {
      const state = errorBoundaryReducer(initialState, setError(new Error("Test")));
      expect(hasError(state)).toBe(true);
    });
  });

  describe("getErrorMessage", () => {
    it("returns error message", () => {
      const state = errorBoundaryReducer(initialState, setError(new Error("Test")));
      expect(getErrorMessage(state)).toBe("Test");
    });

    it("returns unknown for null error", () => {
      expect(getErrorMessage(initialState)).toBe("Unknown error");
    });
  });

  describe("getErrorStack", () => {
    it("returns stack", () => {
      const error = new Error("Test");
      const state = errorBoundaryReducer(initialState, setError(error));
      expect(getErrorStack(state)).toBeDefined();
    });
  });

  describe("isDetailsVisible", () => {
    it("returns false initially", () => {
      expect(isDetailsVisible(initialState)).toBe(false);
    });

    it("returns true when visible", () => {
      const state = errorBoundaryReducer(initialState, toggleDetails());
      expect(isDetailsVisible(state)).toBe(true);
    });
  });

  describe("getErrorDetails", () => {
    it("returns details", () => {
      const state = errorBoundaryReducer(initialState, setError(new Error("Test"), "Info"));
      const details = getErrorDetails(state);
      expect(details).toContain("Test");
      expect(details).toContain("Info");
    });
  });
});
