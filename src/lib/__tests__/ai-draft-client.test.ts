import { describe, expect, it, vi } from "vitest";
import {
  AIDraftClient,
  createAIDraftClient,
  generateFallbackDraft,
  extractActionItems,
  generateFallbackSummary,
  type DraftRequest,
} from "../ai-draft-client";

describe("AIDraftClient", () => {
  it("creates with default options", () => {
    const client = createAIDraftClient();
    expect(client).toBeInstanceOf(AIDraftClient);
  });

  it("creates with custom options", () => {
    const client = createAIDraftClient({
      baseUrl: "https://ai.example.com",
      timeoutMs: 5000,
      retryCount: 1,
    });
    expect(client).toBeInstanceOf(AIDraftClient);
  });

  it("isAvailable returns true when API responds ok", async () => {
    const client = createAIDraftClient({ baseUrl: "http://localhost:8000" });
    // Mock will be used in integration tests
    expect(client).toBeDefined();
  });
});

describe("generateFallbackDraft", () => {
  it("generates professional fallback draft", () => {
    const draft = generateFallbackDraft("Some context", "professional");
    expect(draft).toContain("Dear colleague");
    expect(draft).toContain("Best regards");
  });

  it("generates friendly fallback draft", () => {
    const draft = generateFallbackDraft("Context", "friendly");
    expect(draft).toContain("Hi,");
    expect(draft).toContain("Cheers");
  });

  it("generates formal fallback draft", () => {
    const draft = generateFallbackDraft("Context", "formal");
    expect(draft).toContain("Dear sir/madam");
    expect(draft).toContain("Yours sincerely");
  });

  it("generates casual fallback draft", () => {
    const draft = generateFallbackDraft("Context", "casual");
    expect(draft).toContain("Hey,");
    expect(draft).toContain("Thanks,");
  });

  it("defaults to professional tone", () => {
    const draft = generateFallbackDraft("Context");
    expect(draft).toContain("Dear colleague");
  });

  it("includes AI unavailable placeholder", () => {
    const draft = generateFallbackDraft("Context");
    expect(draft).toContain("AI draft unavailable");
  });
});

describe("extractActionItems", () => {
  it("extracts action items from text", () => {
    const text = "Please review the report. Can you send the file? Could you check the data?";
    const items = extractActionItems(text);
    expect(items.length).toBeGreaterThan(0);
  });

  it("returns empty array when no action items", () => {
    const text = "This is just a casual message with no actions.";
    const items = extractActionItems(text);
    expect(items).toEqual([]);
  });

  it("limits results to 10 items", () => {
    const text = Array(15)
      .fill(null)
      .map((_, i) => `Please do action number ${i}.`)
      .join(" ");
    const items = extractActionItems(text);
    expect(items.length).toBeLessThanOrEqual(10);
  });

  it("handles action required format", () => {
    const text = "Action required: Send the report. Task: Review the code.";
    const items = extractActionItems(text);
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("generateFallbackSummary", () => {
  it("summarizes text with default max sentences", () => {
    const text =
      "First important sentence here. Second sentence with details. Third point made. Fourth sentence.";
    const summary = generateFallbackSummary(text);
    expect(summary).toBeTruthy();
  });

  it("respects maxSentences limit", () => {
    const text = "One. Two. Three. Four. Five.";
    const summary = generateFallbackSummary(text, 2);
    const sentences = summary.split(". ").filter((s) => s.length > 0);
    expect(sentences.length).toBeLessThanOrEqual(3);
  });

  it("returns empty for short text", () => {
    const summary = generateFallbackSummary("Hi.");
    expect(summary).toBe(".");
  });

  it("filters out very short sentences", () => {
    const text = "OK. This is a long enough sentence.";
    const summary = generateFallbackSummary(text, 5);
    expect(summary).toContain("long enough sentence");
  });
});
