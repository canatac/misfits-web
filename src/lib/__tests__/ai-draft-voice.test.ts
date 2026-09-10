/**
 * Unit tests for AI draft in user voice.
 */
import { describe, it, expect } from "vitest";
import {
  createDefaultStyleProfile,
  analyzeUserStyle,
  generateVoiceDraft,
  recordDraftFeedback,
  updateStyleProfileFromFeedback,
  getConfidenceIndicator,
  hasEnoughSamples,
  getStyleDescription,
} from "@/lib/ai-draft-voice";

describe("ai-draft-voice", () => {
  describe("createDefaultStyleProfile", () => {
    it("creates default profile", () => {
      const profile = createDefaultStyleProfile("user-1");
      expect(profile.userId).toBe("user-1");
      expect(profile.tone).toBe("friendly");
      expect(profile.sampleSize).toBe(0);
    });
  });

  describe("analyzeUserStyle", () => {
    it("returns default for empty emails", () => {
      const profile = analyzeUserStyle("user-1", []);
      expect(profile.sampleSize).toBe(0);
    });

    it("analyzes style from emails", () => {
      const emails = [
        { subject: "Test", body: "Hi there, Thanks for your email. Best regards" },
        { subject: "Re: Test", body: "Hello, I hope you're doing well. Cheers" },
      ];
      const profile = analyzeUserStyle("user-1", emails);
      expect(profile.sampleSize).toBe(2);
      expect(profile.averageLength).toBeGreaterThan(0);
    });

    it("detects formal tone", () => {
      const emails = [
        { subject: "Formal", body: "Dear Sir, Sincerely yours, I would like to request" },
      ];
      const profile = analyzeUserStyle("user-1", emails);
      expect(profile.tone).toBe("formal");
    });

    it("detects casual tone", () => {
      const emails = [
        { subject: "Casual", body: "Hey! Thanks for this. Cheers mate!" },
      ];
      const profile = analyzeUserStyle("user-1", emails);
      expect(profile.tone).toBe("casual");
    });
  });

  describe("generateVoiceDraft", () => {
    it("generates draft with greeting and closing", () => {
      const profile = createDefaultStyleProfile("user-1");
      profile.greetingStyle = "Hello";
      profile.closingStyle = "Regards";

      const draft = generateVoiceDraft(profile, {
        originalEmailId: "e1",
        originalSubject: "Meeting",
        originalBody: "Can we meet tomorrow?",
        originalSender: "john@example.com",
      });

      expect(draft.subject).toBe("Re: Meeting");
      expect(draft.body).toContain("Hello");
      expect(draft.body).toContain("Regards");
      expect(draft.confidence).toBe(0);
    });

    it("calculates confidence from sample size", () => {
      const profile = createDefaultStyleProfile("user-1");
      profile.sampleSize = 50;

      const draft = generateVoiceDraft(profile, {
        originalEmailId: "e1",
        originalSubject: "Test",
        originalBody: "Test",
        originalSender: "test@example.com",
      });

      expect(draft.confidence).toBe(1);
      expect(draft.basedOnSamples).toBe(50);
    });
  });

  describe("recordDraftFeedback", () => {
    it("records accepted feedback", () => {
      const feedback = recordDraftFeedback("d1", true, false);
      expect(feedback.accepted).toBe(true);
      expect(feedback.modified).toBe(false);
    });

    it("records modified feedback", () => {
      const feedback = recordDraftFeedback("d1", true, true, "Final body");
      expect(feedback.modified).toBe(true);
      expect(feedback.finalBody).toBe("Final body");
    });
  });

  describe("updateStyleProfileFromFeedback", () => {
    it("does not update for rejected draft", () => {
      const profile = createDefaultStyleProfile("user-1");
      const feedback = recordDraftFeedback("d1", false, false);
      const updated = updateStyleProfileFromFeedback(profile, feedback, "draft");
      expect(updated.sampleSize).toBe(profile.sampleSize);
    });

    it("increases sample size for accepted draft", () => {
      const profile = createDefaultStyleProfile("user-1");
      const feedback = recordDraftFeedback("d1", true, false);
      const updated = updateStyleProfileFromFeedback(profile, feedback, "draft");
      expect(updated.sampleSize).toBe(profile.sampleSize + 1);
    });
  });

  describe("getConfidenceIndicator", () => {
    it("returns learning for few samples", () => {
      expect(getConfidenceIndicator(0, 2)).toBe("Learning your style...");
    });

    it("returns high confidence for many samples", () => {
      expect(getConfidenceIndicator(0.9, 50)).toContain("High confidence");
    });
  });

  describe("hasEnoughSamples", () => {
    it("returns false for < 5 samples", () => {
      const profile = createDefaultStyleProfile("user-1");
      profile.sampleSize = 3;
      expect(hasEnoughSamples(profile)).toBe(false);
    });

    it("returns true for >= 5 samples", () => {
      const profile = createDefaultStyleProfile("user-1");
      profile.sampleSize = 5;
      expect(hasEnoughSamples(profile)).toBe(true);
    });
  });

  describe("getStyleDescription", () => {
    it("returns correct descriptions", () => {
      expect(getStyleDescription("formal")).toBe("Professional and polite");
      expect(getStyleDescription("casual")).toBe("Friendly and relaxed");
      expect(getStyleDescription("friendly")).toBe("Warm and approachable");
      expect(getStyleDescription("direct")).toBe("Concise and to the point");
    });
  });
});
