/**
 * Cross-repo contract test: EmailSummary & FollowUpSuggestion types.
 *
 * Verifies that @/types/ai-triage.ts EmailSummary and FollowUpSuggestion
 * interfaces are fully consumable by UI components.
 */
import { describe, it, expect } from "vitest";
import type { EmailSummary, FollowUpSuggestion, TriageAction } from "@/types/ai-triage";

describe("cross-repo: EmailSummary type contract", () => {
  it("EmailSummary has all required fields", () => {
    const summary: EmailSummary = {
      emailId: "email-1",
      summary: "Meeting rescheduled to Thursday 3pm",
      keyPoints: ["Date changed", "Agenda unchanged"],
      replyHint: "Confirm availability",
      estimatedReadTime: 15,
      generatedAt: new Date().toISOString(),
      source: "ai",
    };

    expect(summary.emailId).toBe("email-1");
    expect(summary.summary).toContain("Meeting");
    expect(summary.keyPoints.length).toBe(2);
    expect(summary.estimatedReadTime).toBeGreaterThan(0);
    expect(summary.source).toBe("ai");
  });

  it("EmailSummary without optional replyHint", () => {
    const summary: EmailSummary = {
      emailId: "email-2",
      summary: "Newsletter digest",
      keyPoints: ["3 new articles"],
      estimatedReadTime: 30,
      generatedAt: new Date().toISOString(),
      source: "rules",
    };

    expect(summary.replyHint).toBeUndefined();
    expect(summary.source).toBe("rules");
  });

  it("estimatedReadTime drives UI reading indicator", () => {
    const summary: EmailSummary = {
      emailId: "email-3",
      summary: "Long technical report",
      keyPoints: ["Quarterly results", "Growth metrics"],
      estimatedReadTime: 120,
      generatedAt: new Date().toISOString(),
      source: "ai",
    };

    const displayMinutes = Math.ceil(summary.estimatedReadTime / 60);
    expect(displayMinutes).toBe(2);
  });
});

describe("cross-repo: FollowUpSuggestion type contract", () => {
  it("FollowUpSuggestion has all required fields", () => {
    const suggestion: FollowUpSuggestion = {
      emailId: "email-4",
      action: "follow_up" as TriageAction,
      reason: "No response received after 48h",
      suggestedDate: "2026-09-15T10:00:00Z",
      draftPrompt: "Hi, following up on my previous email...",
    };

    expect(suggestion.emailId).toBe("email-4");
    expect(suggestion.action).toBe("follow_up");
    expect(suggestion.reason).toContain("48h");
    expect(suggestion.suggestedDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it("FollowUpSuggestion without optional fields", () => {
    const suggestion: FollowUpSuggestion = {
      emailId: "email-5",
      action: "archive" as TriageAction,
      reason: "Low priority newsletter",
    };

    expect(suggestion.suggestedDate).toBeUndefined();
    expect(suggestion.draftPrompt).toBeUndefined();
  });

  it("TriageAction union drives follow-up UI", () => {
    const actions: TriageAction[] = ["reply", "archive", "follow_up", "delegate", "delete"];

    const followUpActions = actions.filter((a) => a !== "delete");
    expect(followUpActions.length).toBe(4);
    expect(followUpActions).toContain("follow_up");
    expect(followUpActions).toContain("delegate");
  });
});
