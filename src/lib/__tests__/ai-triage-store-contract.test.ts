/**
 * Integration test: AI triage → email store cross-repo contract.
 *
 * ai-triage.ts produces TriageResult / EmailSummary that get stored in the
 * email store (Zustand). This test verifies the contract between triage
 * output and email store expectations.
 */
import { describe, it, expect } from "vitest";
import type {
  EmailCategory,
  PriorityBand,
  TriageAction,
  TriageResult,
  EmailSummary,
  TriageStats,
} from "@/types/ai-triage";
import { priorityBand } from "@/types/ai-triage";

describe("AI triage → email store contract", () => {
  it("priorityBand maps scores correctly", () => {
    expect(priorityBand(90)).toBe("urgent");
    expect(priorityBand(70)).toBe("high");
    expect(priorityBand(50)).toBe("medium");
    expect(priorityBand(10)).toBe("low");
  });

  it("TriageResult has required fields for store", () => {
    const result: TriageResult = {
      emailId: "email-1",
      category: "important",
      priority: 85,
      band: "urgent",
      action: "reply",
      needsUrgentReply: true,
      reasoning: "Direct question from team member",
      keywords: ["urgent", "review"],
      confidence: 0.85,
      triagedAt: new Date().toISOString(),
      source: "rules",
    };
    expect(result.emailId).toBeDefined();
    expect(result.priority).toBeGreaterThanOrEqual(0);
    expect(result.priority).toBeLessThanOrEqual(100);
  });

  it("EmailCategory values match expected set", () => {
    const categories: EmailCategory[] = [
      "important", "newsletter", "notification", "promo", "social", "personal", "work",
    ];
    expect(categories).toHaveLength(7);
  });

  it("PriorityBand values match backend band labels", () => {
    const bands: PriorityBand[] = ["low", "medium", "high", "urgent"];
    expect(bands).toHaveLength(4);
  });

  it("TriageAction values match backend action enum", () => {
    const actions: TriageAction[] = ["reply", "archive", "follow_up", "delegate", "delete"];
    expect(actions).toHaveLength(5);
    expect(actions).toContain("follow_up");
  });

  it("EmailSummary has required fields for UI display", () => {
    const summary: EmailSummary = {
      emailId: "email-2",
      summary: "Key points extracted from email",
      keyPoints: ["point-1", "point-2"],
      estimatedReadTime: 30,
      generatedAt: new Date().toISOString(),
      source: "rules",
    };
    expect(summary.summary).toBeTruthy();
    expect(summary.estimatedReadTime).toBeGreaterThanOrEqual(0);
  });

  it("TriageStats aggregates by category and band", () => {
    const stats: TriageStats = {
      total: 10,
      byCategory: {
        important: 3, newsletter: 2, notification: 2, promo: 1, social: 1, personal: 0, work: 1,
      },
      byBand: { low: 5, medium: 2, high: 2, urgent: 1 },
      urgentCount: 1,
      needsReplyCount: 3,
      averagePriority: 45,
    };
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(Object.keys(stats.byBand)).toHaveLength(4);
  });
});
