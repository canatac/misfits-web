/**
 * AI prompt suggestions based on email context (Issue #418).
 *
 * Contextual prompt chips for AI composer that differ
 * between email-view and compose modes.
 */

export type SuggestionMode = "email-view" | "compose";

export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  mode: SuggestionMode;
  icon?: string;
}

export const EMAIL_VIEW_SUGGESTIONS: PromptSuggestion[] = [
  { id: "s1", label: "Répondre positivement", prompt: "Rédige une réponse positive à cet email", mode: "email-view" },
  { id: "s2", label: "Demander plus de détails", prompt: "Demande plus d'informations sur le sujet", mode: "email-view" },
  { id: "s3", label: "Proposer un RDV", prompt: "Propose un rendez-vous pour discuter", mode: "email-view" },
  { id: "s4", label: "Reformuler", prompt: "Reformule ce email de manière professionnelle", mode: "email-view" },
  { id: "s5", label: "Raccourcir", prompt: "Raccourcis ce email tout en gardant l'essentiel", mode: "email-view" },
];

export const COMPOSE_SUGGESTIONS: PromptSuggestion[] = [
  { id: "c1", label: "Email professionnel", prompt: "Rédige un email professionnel", mode: "compose" },
  { id: "c2", label: "Relance", prompt: "Rédige une relance polie", mode: "compose" },
  { id: "c3", label: "S'excuser", prompt: "Rédige un email d'excuses", mode: "compose" },
  { id: "c4", label: "Remercier", prompt: "Rédige un email de remerciement", mode: "compose" },
];

/**
 * Get suggestions for mode.
 */
export function getSuggestionsForMode(mode: SuggestionMode): PromptSuggestion[] {
  return mode === "email-view" ? EMAIL_VIEW_SUGGESTIONS : COMPOSE_SUGGESTIONS;
}

/**
 * Get all suggestions.
 */
export function getAllSuggestions(): PromptSuggestion[] {
  return [...EMAIL_VIEW_SUGGESTIONS, ...COMPOSE_SUGGESTIONS];
}

/**
 * Get suggestion by ID.
 */
export function getSuggestionById(id: string): PromptSuggestion | undefined {
  return getAllSuggestions().find((s) => s.id === id);
}

/**
 * Get suggestion label.
 */
export function getSuggestionLabel(id: string): string {
  return getSuggestionById(id)?.label ?? "";
}

/**
 * Get suggestion prompt.
 */
export function getSuggestionPrompt(id: string): string {
  return getSuggestionById(id)?.prompt ?? "";
}
