"use client";

/**
 * AI model settings — loads/saves Mongo-backed config via /api/settings/ai.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { AppSwitcher } from "@/components/navigation/app-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AI_FEATURE_KEYS,
  DEFAULT_AI_MODEL,
  type AiFeatureKey,
  type AiSettings,
} from "@/types/ai-settings";
import { fetchAiSettings, saveAiSettings } from "@/lib/ai-settings";

const FEATURE_LABELS: Record<AiFeatureKey, string> = {
  compose: "Compose / draft",
  translate: "Traduction",
  triage: "Triage",
  security: "Sécurité",
  rewrite: "Réécriture",
  subject: "Sujets",
  complete: "Autocomplétion",
};

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchAiSettings(true);
      setSettings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const saved = await saveAiSettings(settings);
      setSettings(saved);
      setOk("Enregistré.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = (v: string) => {
    setSettings((s) => (s ? { ...s, defaultModel: v } : s));
  };

  const setFeature = (key: AiFeatureKey, v: string) => {
    setSettings((s) =>
      s
        ? {
            ...s,
            features: { ...s.features, [key]: v },
          }
        : s,
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppSwitcher />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/mail">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Mail
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Paramètres IA</h1>
        </div>

        <p className="mb-6 text-sm text-[var(--color-muted-fg)]">
          Modèles OpenRouter par fonction. Défaut global :{" "}
          <code className="rounded bg-[var(--color-muted)] px-1">
            {DEFAULT_AI_MODEL}
          </code>
          . Persistance Mongo via <code>/api/settings/ai</code>.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        {ok && (
          <div className="mb-4 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            {ok}
          </div>
        )}

        {settings && !loading && (
          <div className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Modèle par défaut</span>
              <Input
                value={settings.defaultModel}
                onChange={(e) => setDefault(e.target.value)}
                placeholder={DEFAULT_AI_MODEL}
                data-testid="ai-default-model"
              />
            </label>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
                Par fonction
              </h2>
              {AI_FEATURE_KEYS.map((key) => (
                <label key={key} className="block space-y-1.5">
                  <span className="text-sm font-medium">
                    {FEATURE_LABELS[key]}
                  </span>
                  <Input
                    value={settings.features[key] ?? settings.defaultModel}
                    onChange={(e) => setFeature(key, e.target.value)}
                    placeholder={settings.defaultModel}
                    data-testid={`ai-feature-${key}`}
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => void onSave()}
                disabled={saving}
                className="gap-2"
                data-testid="ai-settings-save"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </Button>
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                Recharger
              </Button>
              {settings.updatedAt && (
                <span className="text-xs text-[var(--color-muted-fg)]">
                  MAJ {settings.updatedAt}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
