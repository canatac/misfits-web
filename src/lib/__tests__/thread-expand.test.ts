/**
 * Unit tests for thread expand/collapse.
 */
import { describe, it, expect } from "vitest";
import {
  createThreadExpandState,
  expandAll,
  collapseAll,
  toggleExpandAll,
  expandMessage,
  collapseMessage,
  getCollapsedCount,
  getExpandedCount,
  isAllExpanded,
  isButtonDisabled,
  getButtonLabel,
  resetForNewThread,
} from "@/lib/thread-expand";

describe("thread-expand", () => {
  describe("createThreadExpandState", () => {
    it("creates state with only last expanded", () => {
      const state = createThreadExpandState(["m1", "m2", "m3"]);
      expect(state.messages[0].expanded).toBe(false);
      expect(state.messages[1].expanded).toBe(false);
      expect(state.messages[2].expanded).toBe(true);
      expect(state.allExpanded).toBe(false);
    });
  });

  describe("expandAll", () => {
    it("expands all messages", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandAll(state);
      expect(state.allExpanded).toBe(true);
      expect(state.messages.every((m) => m.expanded)).toBe(true);
    });
  });

  describe("collapseAll", () => {
    it("collapses all except last", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandAll(state);
      state = collapseAll(state);
      expect(state.allExpanded).toBe(false);
      expect(getExpandedCount(state)).toBe(1);
    });
  });

  describe("toggleExpandAll", () => {
    it("toggles to expanded", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = toggleExpandAll(state);
      expect(state.allExpanded).toBe(true);
    });

    it("toggles to collapsed", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandAll(state);
      state = toggleExpandAll(state);
      expect(state.allExpanded).toBe(false);
    });
  });

  describe("expandMessage", () => {
    it("expands specific message", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandMessage(state, "m1");
      expect(state.messages[0].expanded).toBe(true);
    });
  });

  describe("collapseMessage", () => {
    it("collapses specific message", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandAll(state);
      state = collapseMessage(state, "m1");
      expect(state.messages[0].expanded).toBe(false);
    });
  });

  describe("getCollapsedCount", () => {
    it("returns collapsed count", () => {
      const state = createThreadExpandState(["m1", "m2", "m3"]);
      expect(getCollapsedCount(state)).toBe(2);
    });
  });

  describe("getExpandedCount", () => {
    it("returns expanded count", () => {
      const state = createThreadExpandState(["m1", "m2", "m3"]);
      expect(getExpandedCount(state)).toBe(1);
    });
  });

  describe("isAllExpanded", () => {
    it("returns false initially", () => {
      const state = createThreadExpandState(["m1", "m2", "m3"]);
      expect(isAllExpanded(state)).toBe(false);
    });

    it("returns true when expanded", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandAll(state);
      expect(isAllExpanded(state)).toBe(true);
    });
  });

  describe("isButtonDisabled", () => {
    it("returns false for >2 messages", () => {
      const state = createThreadExpandState(["m1", "m2", "m3"]);
      expect(isButtonDisabled(state)).toBe(false);
    });

    it("returns true for <=2 messages", () => {
      const state = createThreadExpandState(["m1", "m2"]);
      expect(isButtonDisabled(state)).toBe(true);
    });
  });

  describe("getButtonLabel", () => {
    it("returns expand label", () => {
      const state = createThreadExpandState(["m1", "m2", "m3"]);
      expect(getButtonLabel(state)).toBe("Expand all (2)");
    });

    it("returns collapse label", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandAll(state);
      expect(getButtonLabel(state)).toBe("Collapse all");
    });
  });

  describe("resetForNewThread", () => {
    it("resets for new thread", () => {
      let state = createThreadExpandState(["m1", "m2", "m3"]);
      state = expandAll(state);
      state = resetForNewThread(state, ["n1", "n2"]);
      expect(state.messages).toHaveLength(2);
      expect(state.allExpanded).toBe(false);
    });
  });
});
