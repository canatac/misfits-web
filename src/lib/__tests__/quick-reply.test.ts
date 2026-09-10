/**
 * Unit tests for quick reply.
 */
import { describe, it, expect } from "vitest";
import {
  quickReplyReducer,
  initialState,
  openQuickReply,
  closeQuickReply,
  updateReplyBody,
  resetQuickReply,
  isValidEmail,
  getReplySubject,
  isQuickReplyVisible,
  getReplySummary,
} from "@/lib/quick-reply";

describe("quick-reply", () => {
  describe("quickReplyReducer", () => {
    it("handles OPEN action", () => {
      const action = openQuickReply("test@example.com", "Hello");
      const state = quickReplyReducer(initialState, action);
      expect(state.visible).toBe(true);
      expect(state.recipient).toBe("test@example.com");
      expect(state.subject).toBe("Hello");
    });

    it("handles CLOSE action", () => {
      const openAction = openQuickReply("test@example.com", "Hello");
      let state = quickReplyReducer(initialState, openAction);
      state = quickReplyReducer(state, closeQuickReply());
      expect(state.visible).toBe(false);
    });

    it("handles UPDATE_BODY action", () => {
      const action = updateReplyBody("Reply text");
      const state = quickReplyReducer(initialState, action);
      expect(state.body).toBe("Reply text");
    });

    it("handles RESET action", () => {
      const openAction = openQuickReply("test@example.com", "Hello");
      let state = quickReplyReducer(initialState, openAction);
      state = quickReplyReducer(state, resetQuickReply());
      expect(state.visible).toBe(false);
      expect(state.recipient).toBe("");
    });
  });

  describe("openQuickReply", () => {
    it("creates open action", () => {
      const action = openQuickReply("test@example.com", "Hello", "msg1");
      expect(action.type).toBe("OPEN");
      expect(action.payload?.recipient).toBe("test@example.com");
      expect(action.payload?.originalMessageId).toBe("msg1");
    });
  });

  describe("closeQuickReply", () => {
    it("creates close action", () => {
      const action = closeQuickReply();
      expect(action.type).toBe("CLOSE");
    });
  });

  describe("updateReplyBody", () => {
    it("creates update body action", () => {
      const action = updateReplyBody("text");
      expect(action.type).toBe("UPDATE_BODY");
      expect(action.payload?.body).toBe("text");
    });
  });

  describe("isValidEmail", () => {
    it("validates correct email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("rejects invalid email", () => {
      expect(isValidEmail("invalid")).toBe(false);
    });
  });

  describe("getReplySubject", () => {
    it("adds Re: prefix", () => {
      expect(getReplySubject("Hello")).toBe("Re: Hello");
    });

    it("does not duplicate Re:", () => {
      expect(getReplySubject("Re: Hello")).toBe("Re: Hello");
    });
  });

  describe("isQuickReplyVisible", () => {
    it("returns false initially", () => {
      expect(isQuickReplyVisible(initialState)).toBe(false);
    });

    it("returns true when open", () => {
      const action = openQuickReply("test@example.com", "Hello");
      const state = quickReplyReducer(initialState, action);
      expect(isQuickReplyVisible(state)).toBe(true);
    });
  });

  describe("getReplySummary", () => {
    it("returns empty message", () => {
      expect(getReplySummary(initialState)).toBe("Empty reply");
    });

    it("returns summary", () => {
      const action = openQuickReply("test@example.com", "Hello");
      const state = quickReplyReducer(initialState, action);
      expect(getReplySummary(state)).toContain("test@example.com");
    });
  });
});
