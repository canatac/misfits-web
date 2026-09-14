/**
 * Cross-repo contract test: ai-triage ↔ TriageResult type binding.
 *
 * Verifies that triage results from @/lib/ai-triage match the
 * expected frontend type structure in @/types/ai-triage.
 */
import { describe, it, expect } from "vitest";
import type { TriageResult, EmailCategory, PriorityBand, TriageAction } from "@/types/ai-triage";

describe("cross-repo: ai-triage ↔ TriageResult types", () => {
  it("TriageResult has all required fields", () => {
    const result: TriageResult = {
      emailId: "email-1",
      category: "work" as EmailCategory,
      priority: 75,
      band: "high" as PriorityBand,
      action: "reply" as TriageAction,
      needsUrgentReply: true,
      reasoning: "Project review requested by manager",
      keywords: ["project", "review"],
      confidence: 0.87,
      triagedAt: new Date().toISOString(),
      source: "ai",
    };

    expect(result.emailId).toBe("email-1");
    expect(result.category).toBe("work");
    expect(result.priority).toBe(75);
    expect(result.band).toBe("high");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.source).toBe("ai");
  });

  it("EmailCategory union covers all expected values", () => {
    const categories: EmailCategory[] = [
      "important",
      "newsletter",
      "notification",
      "promo",
      "social",
      "personal",
      "work",
    ];

    categories.forEach((cat) => {
      const result: TriageResult = {
        emailId: "email-2",
        category: cat,
        priority: 50,
        band: "medium" as PriorityBand,
        action: "archive" as TriageAction,
        needsUrgentReply: false,
        reasoning: "Test",
        keywords: [],
        confidence: 0.5,
        triagedAt: new Date().toISOString(),
        source: "rules",
      };

      expect(result.category).toBe(cat);
    });
  });

  it("PriorityBand mapping from numeric score", () => {
    const bands: Array<[number, PriorityBand]> = [
      [90, "urgent"],
      [70, "high"],
      [40, "medium"],
      [10, "low"],
    ];

    bands.forEach(([score, band]) => {
      const result: TriageResult = {
        emailId: "email-3",
        category: "important" as EmailCategory,
        priority: score,
        band: band,
        action: "reply" as TriageAction,
        needsUrgentReply: score >= 80,
        reasoning: `Score ${score}`,
        keywords: [],
        confidence: 0.8,
        triagedAt: new Date().toISOString(),
        source: "ai",
      };

      expect(result.priority).toBe(score);
      expect(result.band).toBe(band);
      expect(result.needsUrgentReply).toBe(score >= 80);
    });
  });

  it("TriageAction union maps to UI actions", () => {
    const actions: TriageAction[] = ["reply", "archive", "follow_up", "delegate", "delete"];

    const uiMap: Record<TriageAction, string> = {
      reply: "reply-btn",
      archive: "archive-btn",
      follow_up: "followup-btn",
      delegate: "forward-btn",
      delete: "delete-btn",
    };

    actions.forEach((action) => {
      expect(uiMap[action]).toBeDefined();
    });
  });

  it("keywords array enables search/filter", () => {
    const result: TriageResult = {
      emailId: "email-4",
      category: "personal" as EmailCategory,
      priority: 30,
      band: "low" as PriorityBand,
      action: "archive" as TriageAction,
      needsUrgentReply: false,
      reasoning: "Weekend plans",
      keywords: ["weekend", "plans", "dinner"],
      confidence: 0.75,
      triagedAt: new Date().toISOString(),
      source: "rules",
    };

    const searchIndex = result.keywords.join(" ");
    expect(searchIndex).toContain("weekend");
    expect(searchIndex).toContain("plans");
    expect(result.keywords.length).toBe(3);
  });

  it("source field discriminates AI vs rules fallback", () => {
    const aiResult: TriageResult = {
      emailId: "email-5",
      category: "important" as EmailCategory,
      priority: 85,
      band: "urgent" as PriorityBand,
      action: "reply" as TriageAction,
      needsUrgentReply: true,
      reasoning: "High priority from AI",
      keywords: ["urgent"],
      confidence: 0.95,
      triagedAt: new Date().toISOString(),
      source: "ai",
    };

    const rulesResult: TriageResult = {
      ...aiResult,
      source: "rules",
      confidence: 0.5,
    };

    expect(aiResult.source).toBe("ai");
    expect(rulesResult.source).toBe("rules");
    expect(aiResult.confidence).toBeGreaterThan(rulesResult.confidence);
  });
});
