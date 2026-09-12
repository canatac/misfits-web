/**
 * newsletter-onboarding.ts — state machine for newsletter onboarding flow.
 *
 * Guides the user through: select topics -> preview picks -> confirm subscribe
 * Tracks current step and which topics are selected.
 */

export type OnboardingStep = "topics" | "preview" | "confirm" | "done";

export interface OnboardingState {
  step: OnboardingStep;
  selectedTopics: string[];
  confirmed: boolean;
}

export const STEP_ORDER: OnboardingStep[] = ["topics", "preview", "confirm", "done"];

export function createOnboardingState(): OnboardingState {
  return { step: "topics", selectedTopics: [], confirmed: false };
}

export function toggleTopic(state: OnboardingState, topic: string): OnboardingState {
  const has = state.selectedTopics.includes(topic);
  return {
    ...state,
    selectedTopics: has
      ? state.selectedTopics.filter((t) => t !== topic)
      : [...state.selectedTopics, topic],
  };
}

/**
 * Advance to the next step. Enforces: topics must be selected before preview.
 * Throws if validation fails.
 */
export function nextStep(state: OnboardingState): OnboardingState {
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx === -1 || idx >= STEP_ORDER.length - 1) return state;
  if (state.step === "topics" && state.selectedTopics.length === 0) {
    throw new Error("Select at least one topic before continuing");
  }
  return { ...state, step: STEP_ORDER[idx + 1] };
}

/** Go back one step. Cannot go before "topics". */
export function prevStep(state: OnboardingState): OnboardingState {
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx <= 0) return state;
  return { ...state, step: STEP_ORDER[idx - 1] };
}

/** Mark onboarding as confirmed/done. */
export function confirmOnboarding(state: OnboardingState): OnboardingState {
  return { ...state, confirmed: true, step: "done" };
}
