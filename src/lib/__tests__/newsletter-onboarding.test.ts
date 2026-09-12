import { describe, expect, it } from "vitest";
import {
  confirmOnboarding,
  createOnboardingState,
  nextStep,
  prevStep,
  toggleTopic,
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
