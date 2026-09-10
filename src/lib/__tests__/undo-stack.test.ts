/**
 * Unit tests for undo stack.
 */
import { describe, it, expect } from "vitest";
import {
  createUndoStack,
  pushAction,
  popAction,
  peekAction,
  clearStack,
  hideToast,
  updateCountdown,
  isToastVisible,
  getCurrentAction,
  getStackSize,
  isStackEmpty,
  isStackFull,
  getActionTypeLabel,
} from "@/lib/undo-stack";

const SAMPLE_ACTION = {
  id: "a1",
  type: "archive" as const,
  emailIds: ["e1"],
  previousState: {},
  timestamp: Date.now(),
};

describe("undo-stack", () => {
  describe("createUndoStack", () => {
    it("creates empty stack", () => {
      const state = createUndoStack();
      expect(state.actions).toEqual([]);
      expect(state.maxSize).toBe(10);
      expect(state.toastVisible).toBe(false);
    });
  });

  describe("pushAction", () => {
    it("pushes action", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      expect(getStackSize(state)).toBe(1);
      expect(state.toastVisible).toBe(true);
    });

    it("evicts oldest when full", () => {
      let state = createUndoStack(2);
      state = pushAction(state, { ...SAMPLE_ACTION, id: "a1" });
      state = pushAction(state, { ...SAMPLE_ACTION, id: "a2" });
      state = pushAction(state, { ...SAMPLE_ACTION, id: "a3" });
      expect(getStackSize(state)).toBe(2);
      expect(peekAction(state)?.id).toBe("a3");
    });
  });

  describe("popAction", () => {
    it("pops latest action", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      const { state: newState, action } = popAction(state);
      expect(getStackSize(newState)).toBe(0);
      expect(action?.id).toBe("a1");
    });

    it("returns null when empty", () => {
      const state = createUndoStack();
      const { action } = popAction(state);
      expect(action).toBeNull();
    });
  });

  describe("peekAction", () => {
    it("peeks latest action", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      expect(peekAction(state)?.id).toBe("a1");
    });

    it("returns null when empty", () => {
      const state = createUndoStack();
      expect(peekAction(state)).toBeNull();
    });
  });

  describe("clearStack", () => {
    it("clears all actions", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      state = clearStack(state);
      expect(getStackSize(state)).toBe(0);
      expect(state.toastVisible).toBe(false);
    });
  });

  describe("hideToast", () => {
    it("hides toast", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      state = hideToast(state);
      expect(state.toastVisible).toBe(false);
    });
  });

  describe("updateCountdown", () => {
    it("updates countdown", () => {
      let state = createUndoStack();
      state = updateCountdown(state, 3000);
      expect(state.countdown).toBe(3000);
    });
  });

  describe("isToastVisible", () => {
    it("returns false initially", () => {
      const state = createUndoStack();
      expect(isToastVisible(state)).toBe(false);
    });

    it("returns true when action pushed", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      expect(isToastVisible(state)).toBe(true);
    });
  });

  describe("getCurrentAction", () => {
    it("returns current action", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      expect(getCurrentAction(state)?.id).toBe("a1");
    });
  });

  describe("getStackSize", () => {
    it("returns size", () => {
      let state = createUndoStack();
      expect(getStackSize(state)).toBe(0);
      state = pushAction(state, SAMPLE_ACTION);
      expect(getStackSize(state)).toBe(1);
    });
  });

  describe("isStackEmpty", () => {
    it("returns true when empty", () => {
      const state = createUndoStack();
      expect(isStackEmpty(state)).toBe(true);
    });

    it("returns false when not empty", () => {
      let state = createUndoStack();
      state = pushAction(state, SAMPLE_ACTION);
      expect(isStackEmpty(state)).toBe(false);
    });
  });

  describe("isStackFull", () => {
    it("returns false when not full", () => {
      const state = createUndoStack(2);
      expect(isStackFull(state)).toBe(false);
    });

    it("returns true when full", () => {
      let state = createUndoStack(1);
      state = pushAction(state, SAMPLE_ACTION);
      expect(isStackFull(state)).toBe(true);
    });
  });

  describe("getActionTypeLabel", () => {
    it("returns archive label", () => {
      expect(getActionTypeLabel({ ...SAMPLE_ACTION, type: "archive" })).toBe("Archived");
    });

    it("returns delete label", () => {
      expect(getActionTypeLabel({ ...SAMPLE_ACTION, type: "delete" })).toBe("Deleted");
    });
  });
});
