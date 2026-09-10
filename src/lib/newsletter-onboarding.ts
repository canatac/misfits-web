/**
 * Newsletter Source Onboarding Wizard (Issue #472).
 *
 * Guided setup wizard for newsletter sources with popular presets,
 * custom RSS/Atom URL input, and progress tracking.
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface NewsletterSource {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  popular: boolean;
}

export interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  selectedSources: NewsletterSource[];
  customUrls: string[];
  completed: boolean;
}

export const POPULAR_SOURCES: NewsletterSource[] = [
  { id: "s1", name: "TechCrunch", url: "https://techcrunch.com/feed", category: "Tech", popular: true },
  { id: "s2", name: "The Verge", url: "https://theverge.com/rss/index.xml", category: "Tech", popular: true },
  { id: "s3", name: "Hacker News", url: "https://news.ycombinator.com/rss", category: "Tech", popular: true },
  { id: "s4", name: "Substack", url: "https://substack.com/feed", category: "Various", popular: true },
];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "step-1", title: "Choose sources", description: "Select popular newsletters to follow", completed: false },
  { id: "step-2", title: "Add custom RSS", description: "Add your own RSS/Atom feeds", completed: false },
  { id: "step-3", title: "Done", description: "Review your selections", completed: false },
];

/**
 * Create initial onboarding state.
 */
export function createOnboardingState(): OnboardingState {
  return {
    currentStep: 0,
    steps: ONBOARDING_STEPS.map((s) => ({ ...s })),
    selectedSources: [],
    customUrls: [],
    completed: false,
  };
}

/**
 * Go to next step.
 */
export function nextStep(state: OnboardingState): OnboardingState {
  const newSteps = [...state.steps];
  newSteps[state.currentStep] = { ...newSteps[state.currentStep], completed: true };

  return {
    ...state,
    currentStep: Math.min(state.currentStep + 1, state.steps.length - 1),
    steps: newSteps,
  };
}

/**
 * Go to previous step.
 */
export function previousStep(state: OnboardingState): OnboardingState {
  return {
    ...state,
    currentStep: Math.max(state.currentStep - 1, 0),
  };
}

/**
 * Add a source to selection.
 */
export function addSource(state: OnboardingState, source: NewsletterSource): OnboardingState {
  if (state.selectedSources.some((s) => s.id === source.id)) {
    return state;
  }
  return {
    ...state,
    selectedSources: [...state.selectedSources, source],
  };
}

/**
 * Remove a source from selection.
 */
export function removeSource(state: OnboardingState, sourceId: string): OnboardingState {
  return {
    ...state,
    selectedSources: state.selectedSources.filter((s) => s.id !== sourceId),
  };
}

/**
 * Add custom URL.
 */
export function addCustomUrl(state: OnboardingState, url: string): OnboardingState {
  if (state.customUrls.includes(url)) return state;
  return {
    ...state,
    customUrls: [...state.customUrls, url],
  };
}

/**
 * Remove custom URL.
 */
export function removeCustomUrl(state: OnboardingState, url: string): OnboardingState {
  return {
    ...state,
    customUrls: state.customUrls.filter((u) => u !== url),
  };
}

/**
 * Complete onboarding.
 */
export function completeOnboarding(state: OnboardingState): OnboardingState {
  const newSteps = state.steps.map((s) => ({ ...s, completed: true }));
  return {
    ...state,
    steps: newSteps,
    completed: true,
  };
}

/**
 * Check if onboarding is complete.
 */
export function isOnboardingComplete(state: OnboardingState): boolean {
  return state.completed;
}

/**
 * Get current step.
 */
export function getCurrentStep(state: OnboardingState): OnboardingStep {
  return state.steps[state.currentStep];
}

/**
 * Get total selected count.
 */
export function getTotalSelectedCount(state: OnboardingState): number {
  return state.selectedSources.length + state.customUrls.length;
}

/**
 * Validate RSS URL format.
 */
export function isValidRssUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Get popular sources by category.
 */
export function getPopularSourcesByCategory(category: string): NewsletterSource[] {
  return POPULAR_SOURCES.filter((s) => s.category === category);
}

/**
 * Get all popular sources.
 */
export function getPopularSources(): NewsletterSource[] {
  return POPULAR_SOURCES.filter((s) => s.popular);
}

/**
 * Search sources by name.
 */
export function searchSources(query: string): NewsletterSource[] {
  const lower = query.toLowerCase();
  return POPULAR_SOURCES.filter((s) => s.name.toLowerCase().includes(lower));
}
