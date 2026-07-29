/** AI settings stored in Mongo via GET/PUT /api/settings/ai */

export type AiFeatureKey =
  | "compose"
  | "translate"
  | "triage"
  | "security"
  | "rewrite"
  | "subject"
  | "complete";

export const AI_FEATURE_KEYS: AiFeatureKey[] = [
  "compose",
  "translate",
  "triage",
  "security",
  "rewrite",
  "subject",
  "complete",
];

export const DEFAULT_AI_MODEL = "qwen/qwen3.7-flash";

export interface AiSettings {
  defaultModel: string;
  features: Record<string, string>;
  updatedAt?: string | null;
}

export function defaultAiSettings(): AiSettings {
  const features: Record<string, string> = {};
  for (const k of AI_FEATURE_KEYS) features[k] = DEFAULT_AI_MODEL;
  return {
    defaultModel: DEFAULT_AI_MODEL,
    features,
    updatedAt: null,
  };
}
