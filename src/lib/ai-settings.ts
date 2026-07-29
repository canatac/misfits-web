/**
 * Client for GET/PUT /api/settings/ai + short-lived in-memory cache.
 */
import { mailAuthHeaders } from "@/lib/mail-api";
import {
  AI_FEATURE_KEYS,
  DEFAULT_AI_MODEL,
  defaultAiSettings,
  type AiFeatureKey,
  type AiSettings,
} from "@/types/ai-settings";

const CACHE_TTL_MS = 30_000;
let cache: { at: number; value: AiSettings } | null = null;

export function invalidateAiSettingsCache() {
  cache = null;
}

export async function fetchAiSettings(force = false): Promise<AiSettings> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  try {
    const res = await fetch("/api/settings/ai", {
      headers: mailAuthHeaders(),
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`settings ${res.status}`);
    const data = (await res.json()) as AiSettings;
    const merged = mergeSettings(data);
    cache = { at: Date.now(), value: merged };
    return merged;
  } catch {
    const fallback = defaultAiSettings();
    cache = { at: Date.now(), value: fallback };
    return fallback;
  }
}

export async function saveAiSettings(
  patch: Partial<AiSettings>,
): Promise<AiSettings> {
  const res = await fetch("/api/settings/ai", {
    method: "PUT",
    headers: mailAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({
      defaultModel: patch.defaultModel,
      features: patch.features,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `save failed ${res.status}`);
  }
  const data = (await res.json()) as AiSettings;
  const merged = mergeSettings(data);
  cache = { at: Date.now(), value: merged };
  return merged;
}

function mergeSettings(data: AiSettings): AiSettings {
  const base = defaultAiSettings();
  const features = { ...base.features, ...(data.features || {}) };
  for (const k of AI_FEATURE_KEYS) {
    if (!features[k]) features[k] = base.defaultModel;
  }
  return {
    defaultModel: data.defaultModel?.trim() || DEFAULT_AI_MODEL,
    features,
    updatedAt: data.updatedAt ?? null,
  };
}

export async function resolveFeatureModel(
  feature: AiFeatureKey | string,
): Promise<string> {
  const s = await fetchAiSettings();
  return (
    s.features?.[feature]?.trim() ||
    s.defaultModel?.trim() ||
    DEFAULT_AI_MODEL
  );
}
