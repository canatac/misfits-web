/**
 * Unit tests for newsletter source onboarding wizard.
 */
import { describe, it, expect } from "vitest";
import {
  createOnboardingState,
  nextStep,
  previousStep,
  addSource,
  removeSource,
  addCustomUrl,
  removeCustomUrl,
  completeOnboarding,
  isOnboardingComplete,
  getCurrentStep,
  getTotalSelectedCount,
  isValidRssUrl,
  getPopularSourcesByCategory,
  getPopularSources,
  searchSources,
  confirmOnboarding,
  prevStep,
  toggleTopic,
} from "@/lib/newsletter-onboarding";

import {
} from "@/lib/newsletter-onboarding";

describe("newsletter-onboarding", () => {
  it("starts at topics step", () => {
    const s = createOnboardingState();
    expect(s.step).toBe("topics");
    expect(s.selectedTopics).toEqual([]);
  });

  it("toggles a topic on and off", () => {
    let s = createOnboardingState();
    s = toggleTopic(s, "tech");
    expect(s.selectedTopics).toContain("tech");
    s = toggleTopic(s, "tech");
    expect(s.selectedTopics).not.toContain("tech");
  });

  it("advances step by step", () => {
    let s = toggleTopic(createOnboardingState(), "ai");
    s = nextStep(s);
    expect(s.step).toBe("preview");
    s = nextStep(s);
    expect(s.step).toBe("confirm");
  });

  it("throws if no topics selected", () => {
    const s = createOnboardingState();
    expect(() => nextStep(s)).toThrow(/at least one topic/i);
  });

  it("goes back one step", () => {
    let s = toggleTopic(createOnboardingState(), "ai");
    s = nextStep(s);
    s = prevStep(s);
    expect(s.step).toBe("topics");
  });

  it("cannot go before topics", () => {
    const s = prevStep(createOnboardingState());
    expect(s.step).toBe("topics");
  });

  it("confirms and sets done", () => {
    let s = toggleTopic(createOnboardingState(), "ai");
    s = nextStep(s); s = nextStep(s);
    s = confirmOnboarding(s);
    expect(s.confirmed).toBe(true);
    expect(s.step).toBe("done");
  });
});

describe("newsletter-onboarding", () => {
  describe("createOnboardingState", () => {
    it("creates initial state", () => {
      const state = createOnboardingState();
      expect(state.currentStep).toBe(0);
      expect(state.steps).toHaveLength(3);
      expect(state.completed).toBe(false);
    });
  });

  describe("nextStep", () => {
    it("advances to next step", () => {
      const state = createOnboardingState();
      const next = nextStep(state);
      expect(next.currentStep).toBe(1);
      expect(next.steps[0].completed).toBe(true);
    });
  });

  describe("previousStep", () => {
    it("goes back to previous step", () => {
      let state = createOnboardingState();
      state = nextStep(state);
      const prev = previousStep(state);
      expect(prev.currentStep).toBe(0);
    });
  });

  describe("addSource", () => {
    it("adds source to selection", () => {
      const state = createOnboardingState();
      const newState = addSource(state, { id: "s1", name: "Test", url: "https://test.com", category: "Tech", popular: true });
      expect(newState.selectedSources).toHaveLength(1);
    });

    it("does not add duplicate", () => {
      let state = createOnboardingState();
      const source = { id: "s1", name: "Test", url: "https://test.com", category: "Tech", popular: true };
      state = addSource(state, source);
      const newState = addSource(state, source);
      expect(newState.selectedSources).toHaveLength(1);
    });
  });

  describe("removeSource", () => {
    it("removes source from selection", () => {
      let state = createOnboardingState();
      const source = { id: "s1", name: "Test", url: "https://test.com", category: "Tech", popular: true };
      state = addSource(state, source);
      const newState = removeSource(state, "s1");
      expect(newState.selectedSources).toHaveLength(0);
    });
  });

  describe("addCustomUrl", () => {
    it("adds custom URL", () => {
      const state = createOnboardingState();
      const newState = addCustomUrl(state, "https://example.com/feed");
      expect(newState.customUrls).toHaveLength(1);
    });
  });

  describe("removeCustomUrl", () => {
    it("removes custom URL", () => {
      let state = createOnboardingState();
      state = addCustomUrl(state, "https://example.com/feed");
      const newState = removeCustomUrl(state, "https://example.com/feed");
      expect(newState.customUrls).toHaveLength(0);
    });
  });

  describe("completeOnboarding", () => {
    it("marks as complete", () => {
      const state = createOnboardingState();
      const completed = completeOnboarding(state);
      expect(completed.completed).toBe(true);
      expect(completed.steps.every((s) => s.completed)).toBe(true);
    });
  });

  describe("isOnboardingComplete", () => {
    it("returns false initially", () => {
      const state = createOnboardingState();
      expect(isOnboardingComplete(state)).toBe(false);
    });
  });

  describe("getCurrentStep", () => {
    it("returns current step", () => {
      const state = createOnboardingState();
      const step = getCurrentStep(state);
      expect(step.id).toBe("step-1");
    });
  });

  describe("getTotalSelectedCount", () => {
    it("returns total count", () => {
      let state = createOnboardingState();
      state = addSource(state, { id: "s1", name: "Test", url: "https://test.com", category: "Tech", popular: true });
      state = addCustomUrl(state, "https://example.com/feed");
      expect(getTotalSelectedCount(state)).toBe(2);
    });
  });

  describe("isValidRssUrl", () => {
    it("validates correct URL", () => {
      expect(isValidRssUrl("https://example.com/feed")).toBe(true);
    });

    it("rejects invalid URL", () => {
      expect(isValidRssUrl("not-a-url")).toBe(false);
    });
  });

  describe("getPopularSourcesByCategory", () => {
    it("returns sources for category", () => {
      const sources = getPopularSourcesByCategory("Tech");
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe("getPopularSources", () => {
    it("returns all popular sources", () => {
      const sources = getPopularSources();
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe("searchSources", () => {
    it("searches by name", () => {
      const results = searchSources("tech");
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
