"use client";

import {
  AI_FEATURE_KEYS,
  DEFAULT_AI_MODEL,
  type AiSettings,
} from "@/types/ai-settings";
import {
  LLM_PROVIDER_OPTIONS,
  type LlmProvider,
  type LlmSecrets,
} from "../_lib/constants";

export function LlmSection({
  llmProvider,
  setLlmProvider,
  llmSecrets,
  setLlmSecrets,
  aiSettings,
  setAiSettings,
  llmSaving,
  llmFeedback,
  handleSaveLlmSettings,
}: {
  llmProvider: LlmProvider;
  setLlmProvider: (p: LlmProvider) => void;
  llmSecrets: LlmSecrets;
  setLlmSecrets: React.Dispatch<React.SetStateAction<LlmSecrets>>;
  aiSettings: AiSettings;
  setAiSettings: React.Dispatch<React.SetStateAction<AiSettings>>;
  llmSaving: boolean;
  llmFeedback: string | null;
  handleSaveLlmSettings: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#242427] bg-[#121214] p-5">
      <h2 className="mb-1 text-sm font-semibold tracking-wide text-[#71717A] uppercase">
        LLM (provider, modèles, clés API)
      </h2>
      <p className="mb-4 text-xs text-[#A1A1AA]">
        Choix du provider LLM + clé API locale + mapping des modèles système.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-[#A1A1AA]">Provider LLM actif</span>
          <select
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value as LlmProvider)}
            className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white outline-none focus:border-[#C49B66]"
          >
            {LLM_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-[#A1A1AA]">Modèle par défaut système</span>
          <input
            value={aiSettings.defaultModel || DEFAULT_AI_MODEL}
            onChange={(e) =>
              setAiSettings((prev) => ({
                ...prev,
                defaultModel: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white outline-none focus:border-[#C49B66]"
            placeholder="qwen/qwen3.7-flash"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {LLM_PROVIDER_OPTIONS.map((provider) => (
          <label key={provider} className="space-y-1">
            <span className="text-[11px] text-[#71717A]">API key {provider}</span>
            <input
              type="password"
              value={llmSecrets[provider] || ""}
              onChange={(e) =>
                setLlmSecrets((prev) => ({
                  ...prev,
                  [provider]: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#C49B66]"
              placeholder="sk-..."
            />
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-[#242427] bg-[#0A0A0B] p-3">
        <h3 className="mb-3 text-xs font-semibold text-[#A1A1AA]">
          Modèles par fonctionnalité
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {AI_FEATURE_KEYS.map((featureKey) => (
            <label key={featureKey} className="space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-[#71717A]">
                {featureKey}
              </span>
              <input
                value={aiSettings.features?.[featureKey] || aiSettings.defaultModel}
                onChange={(e) =>
                  setAiSettings((prev) => ({
                    ...prev,
                    features: {
                      ...prev.features,
                      [featureKey]: e.target.value,
                    },
                  }))
                }
                className="w-full rounded-lg border border-[#242427] bg-[#121214] px-3 py-2 text-xs text-white outline-none focus:border-[#C49B66]"
                placeholder="provider/model"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSaveLlmSettings}
          disabled={llmSaving}
          className="rounded-xl border border-[#4F46E5]/70 bg-[#191A2C] px-4 py-2 text-sm font-semibold text-[#B7B3FF] transition hover:border-[#4F46E5] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {llmSaving ? "Sauvegarde..." : "Sauvegarder LLM"}
        </button>

        {llmFeedback ? <p className="text-xs text-[#4ADE80]">{llmFeedback}</p> : null}
      </div>
    </div>
  );
}
