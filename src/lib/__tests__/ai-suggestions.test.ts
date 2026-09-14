import { describe, it, expect } from "vitest";
import {
  getSuggestionsForMode,
  getAllSuggestions,
  getSuggestionById,
  getSuggestionLabel,
  getSuggestionPrompt,
} from "@/lib/ai-suggestions";

describe("ai-suggestions", () => {
  it("returns email-view suggestions", () => {
    const suggestions = getSuggestionsForMode("email-view");
    expect(suggestions).toHaveLength(5);
    expect(suggestions[0].mode).toBe("email-view");
  });

  it("returns compose suggestions", () => {
    const suggestions = getSuggestionsForMode("compose");
    expect(suggestions).toHaveLength(4);
    expect(suggestions[0].mode).toBe("compose");
  });

  it("returns all suggestions", () => {
    const suggestions = getAllSuggestions();
    expect(suggestions).toHaveLength(9);
  });

  it("gets suggestion by ID", () => {
    const suggestion = getSuggestionById("s1");
    expect(suggestion?.id).toBe("s1");
    expect(suggestion?.label).toBe("Répondre positivement");
  });

  it("gets suggestion label", () => {
    expect(getSuggestionLabel("s1")).toBe("Répondre positivement");
  });

  it("gets suggestion prompt", () => {
    expect(getSuggestionPrompt("c1")).toContain("professionnel");
  });
});
