/**
 * Unit tests for split inbox utility.
 */
import { describe, it, expect } from "vitest";
import {
  getDefaultSplitInboxSettings,
  createSplitInboxState,
  classifyEmail,
  moveEmailToSection,
  getEmailsInSection,
  isEmailInSection,
  getEmailSection,
  getClassification,
  isUserCorrected,
  getSectionLabel,
  getSectionDescription,
  getSectionCount,
  getTotalCount,
  isSplitInboxEmpty,
  removeEmailFromSplitInbox,
  clearSplitInbox,
  getCorrectionStats,
  shouldReclassify,
} from "@/lib/split-inbox";

describe("split-inbox", () => {
  describe("getDefaultSplitInboxSettings", () => {
    it("returns default settings", () => {
      const settings = getDefaultSplitInboxSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.autoLearn).toBe(true);
      expect(settings.importantThreshold).toBe(0.5);
    });
  });

  describe("createSplitInboxState", () => {
    it("creates empty state", () => {
      const state = createSplitInboxState();
      expect(state.important).toHaveLength(0);
      expect(state.other).toHaveLength(0);
      expect(state.classifications.size).toBe(0);
    });
  });

  describe("classifyEmail", () => {
    it("classifies as important when confidence >= threshold", () => {
      const classified = classifyEmail("e1", 0.7, 0.5);
      expect(classified.section).toBe("important");
    });

    it("classifies as other when confidence < threshold", () => {
      const classified = classifyEmail("e1", 0.3, 0.5);
      expect(classified.section).toBe("other");
    });

    it("uses default threshold", () => {
      const classified = classifyEmail("e1", 0.6);
      expect(classified.section).toBe("important");
    });
  });

  describe("moveEmailToSection", () => {
    it("moves email to important", () => {
      const state = createSplitInboxState();
      state.other.push("e1");
      const newState = moveEmailToSection(state, "e1", "important");
      expect(newState.important).toContain("e1");
      expect(newState.other).not.toContain("e1");
    });

    it("moves email to other", () => {
      const state = createSplitInboxState();
      state.important.push("e1");
      const newState = moveEmailToSection(state, "e1", "other");
      expect(newState.other).toContain("e1");
      expect(newState.important).not.toContain("e1");
    });

    it("marks classification as user-corrected", () => {
      const state = createSplitInboxState();
      state.other.push("e1");
      state.classifications.set("e1", classifyEmail("e1", 0.3));
      const newState = moveEmailToSection(state, "e1", "important");
      expect(newState.classifications.get("e1")?.userCorrected).toBe(true);
    });
  });

  describe("getEmailsInSection", () => {
    it("returns important emails", () => {
      const state = createSplitInboxState();
      state.important.push("e1", "e2");
      expect(getEmailsInSection(state, "important")).toEqual(["e1", "e2"]);
    });

    it("returns other emails", () => {
      const state = createSplitInboxState();
      state.other.push("e1");
      expect(getEmailsInSection(state, "other")).toEqual(["e1"]);
    });
  });

  describe("isEmailInSection", () => {
    it("returns true when email is in section", () => {
      const state = createSplitInboxState();
      state.important.push("e1");
      expect(isEmailInSection(state, "e1", "important")).toBe(true);
    });

    it("returns false when email is not in section", () => {
      const state = createSplitInboxState();
      state.other.push("e1");
      expect(isEmailInSection(state, "e1", "important")).toBe(false);
    });
  });

  describe("getEmailSection", () => {
    it("returns important for important email", () => {
      const state = createSplitInboxState();
      state.important.push("e1");
      expect(getEmailSection(state, "e1")).toBe("important");
    });

    it("returns null for unknown email", () => {
      const state = createSplitInboxState();
      expect(getEmailSection(state, "e1")).toBeNull();
    });
  });

  describe("getClassification", () => {
    it("returns classification for email", () => {
      const state = createSplitInboxState();
      state.classifications.set("e1", classifyEmail("e1", 0.7));
      const classification = getClassification(state, "e1");
      expect(classification).toBeDefined();
      expect(classification?.confidence).toBe(0.7);
    });

    it("returns undefined for unknown email", () => {
      const state = createSplitInboxState();
      expect(getClassification(state, "e1")).toBeUndefined();
    });
  });

  describe("isUserCorrected", () => {
    it("returns false for non-corrected email", () => {
      const state = createSplitInboxState();
      state.classifications.set("e1", classifyEmail("e1", 0.7));
      expect(isUserCorrected(state, "e1")).toBe(false);
    });
  });

  describe("getSectionLabel", () => {
    it("returns correct labels", () => {
      expect(getSectionLabel("important")).toBe("Important");
      expect(getSectionLabel("other")).toBe("Other");
    });
  });

  describe("getSectionDescription", () => {
    it("returns correct descriptions", () => {
      expect(getSectionDescription("important")).toContain("attention");
      expect(getSectionDescription("other")).toContain("Newsletters");
    });
  });

  describe("getSectionCount", () => {
    it("returns correct count", () => {
      const state = createSplitInboxState();
      state.important.push("e1", "e2");
      state.other.push("e3");
      expect(getSectionCount(state, "important")).toBe(2);
      expect(getSectionCount(state, "other")).toBe(1);
    });
  });

  describe("getTotalCount", () => {
    it("returns total count", () => {
      const state = createSplitInboxState();
      state.important.push("e1");
      state.other.push("e2", "e3");
      expect(getTotalCount(state)).toBe(3);
    });
  });

  describe("isSplitInboxEmpty", () => {
    it("returns true for empty inbox", () => {
      const state = createSplitInboxState();
      expect(isSplitInboxEmpty(state)).toBe(true);
    });

    it("returns false for non-empty inbox", () => {
      const state = createSplitInboxState();
      state.important.push("e1");
      expect(isSplitInboxEmpty(state)).toBe(false);
    });
  });

  describe("removeEmailFromSplitInbox", () => {
    it("removes email", () => {
      const state = createSplitInboxState();
      state.important.push("e1");
      state.classifications.set("e1", classifyEmail("e1", 0.7));
      const newState = removeEmailFromSplitInbox(state, "e1");
      expect(newState.important).not.toContain("e1");
      expect(newState.classifications.has("e1")).toBe(false);
    });
  });

  describe("clearSplitInbox", () => {
    it("clears all emails", () => {
      const state = createSplitInboxState();
      state.important.push("e1");
      state.other.push("e2");
      const newState = clearSplitInbox(state);
      expect(newState.important).toHaveLength(0);
      expect(newState.other).toHaveLength(0);
    });
  });

  describe("getCorrectionStats", () => {
    it("returns correct stats", () => {
      const state = createSplitInboxState();
      state.classifications.set("e1", classifyEmail("e1", 0.7));
      state.classifications.set("e2", { ...classifyEmail("e2", 0.3), userCorrected: true });
      const stats = getCorrectionStats(state);
      expect(stats.total).toBe(2);
      expect(stats.corrected).toBe(1);
      expect(stats.correctionRate).toBe(0.5);
    });
  });

  describe("shouldReclassify", () => {
    it("returns false for non-corrected email", () => {
      const state = createSplitInboxState();
      state.classifications.set("e1", classifyEmail("e1", 0.7));
      expect(shouldReclassify(state, "e1")).toBe(false);
    });

    it("returns true for corrected email", () => {
      const state = createSplitInboxState();
      state.classifications.set("e1", { ...classifyEmail("e1", 0.7), userCorrected: true });
      expect(shouldReclassify(state, "e1")).toBe(true);
    });
  });
});
