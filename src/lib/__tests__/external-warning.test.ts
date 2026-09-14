/**
 * Unit tests for external recipient warning.
 */
import { describe, it, expect } from "vitest";
import {
  externalWarningReducer,
  initialState,
  isExternalRecipient,
  filterExternalRecipients,
  shouldShowWarning,
  getExternalEmails,
  getExternalCount,
  isWarningVisible,
  isSuppressedForSession,
} from "@/lib/external-warning";

const SAMPLE_RECIPIENTS = [
  { email: "internal@misfits.ai", name: "Internal", internal: true },
  { email: "external@gmail.com", name: "External", internal: false },
  { email: "another@misfits.ai", name: "Another Internal", internal: true },
];

describe("external-warning", () => {
  describe("externalWarningReducer", () => {
    it("handles SHOW_DIALOG action", () => {
      const action = { type: "SHOW_DIALOG" as const, payload: { recipients: [SAMPLE_RECIPIENTS[1]] } };
      const state = externalWarningReducer(initialState, action);
      expect(state.showDialog).toBe(true);
      expect(state.externalRecipients).toEqual([SAMPLE_RECIPIENTS[1]]);
    });

    it("handles HIDE_DIALOG action", () => {
      const showAction = { type: "SHOW_DIALOG" as const, payload: { recipients: [SAMPLE_RECIPIENTS[1]] } };
      let state = externalWarningReducer(initialState, showAction);
      state = externalWarningReducer(state, { type: "HIDE_DIALOG" });
      expect(state.showDialog).toBe(false);
    });

    it("handles SET_SUPPRESS action", () => {
      const action = { type: "SET_SUPPRESS" as const, payload: { suppress: true } };
      const state = externalWarningReducer(initialState, action);
      expect(state.suppressForSession).toBe(true);
    });
  });

  describe("isExternalRecipient", () => {
    it("returns true for external email", () => {
      expect(isExternalRecipient(SAMPLE_RECIPIENTS[1], ["misfits.ai"])).toBe(true);
    });

    it("returns false for internal email", () => {
      expect(isExternalRecipient(SAMPLE_RECIPIENTS[0], ["misfits.ai"])).toBe(false);
    });
  });

  describe("filterExternalRecipients", () => {
    it("filters external recipients", () => {
      const external = filterExternalRecipients(SAMPLE_RECIPIENTS, ["misfits.ai"]);
      expect(external).toHaveLength(1);
      expect(external[0].email).toBe("external@gmail.com");
    });
  });

  describe("shouldShowWarning", () => {
    it("returns true when external recipients exist", () => {
      const state = externalWarningReducer(
        initialState,
        { type: "SHOW_DIALOG", payload: { recipients: [SAMPLE_RECIPIENTS[1]] } }
      );
      expect(shouldShowWarning(state, SAMPLE_RECIPIENTS, ["misfits.ai"])).toBe(true);
    });

    it("returns false when suppressed", () => {
      let state = externalWarningReducer(
        initialState,
        { type: "SHOW_DIALOG", payload: { recipients: [SAMPLE_RECIPIENTS[1]] } }
      );
      state = externalWarningReducer(state, { type: "SET_SUPPRESS", payload: { suppress: true } });
      expect(shouldShowWarning(state, SAMPLE_RECIPIENTS, ["misfits.ai"])).toBe(false);
    });
  });

  describe("getExternalEmails", () => {
    it("returns external emails", () => {
      const state = externalWarningReducer(
        initialState,
        { type: "SHOW_DIALOG", payload: { recipients: [SAMPLE_RECIPIENTS[1]] } }
      );
      expect(getExternalEmails(state)).toEqual(["external@gmail.com"]);
    });
  });

  describe("getExternalCount", () => {
    it("returns count", () => {
      const state = externalWarningReducer(
        initialState,
        { type: "SHOW_DIALOG", payload: { recipients: [SAMPLE_RECIPIENTS[1]] } }
      );
      expect(getExternalCount(state)).toBe(1);
    });
  });

  describe("isWarningVisible", () => {
    it("returns false initially", () => {
      expect(isWarningVisible(initialState)).toBe(false);
    });

    it("returns true when shown", () => {
      const state = externalWarningReducer(
        initialState,
        { type: "SHOW_DIALOG", payload: { recipients: [SAMPLE_RECIPIENTS[1]] } }
      );
      expect(isWarningVisible(state)).toBe(true);
    });
  });

  describe("isSuppressedForSession", () => {
    it("returns false initially", () => {
      expect(isSuppressedForSession(initialState)).toBe(false);
    });

    it("returns true when suppressed", () => {
      const state = externalWarningReducer(
        initialState,
        { type: "SET_SUPPRESS", payload: { suppress: true } }
      );
      expect(isSuppressedForSession(state)).toBe(true);
    });
  });
});
