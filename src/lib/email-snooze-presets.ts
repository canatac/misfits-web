/**
 * email-snooze-presets.ts - snooze duration presets for misfits.ai Mail.
 */
export type SnoozePreset = {
  id: string;
  label: string;
  labelFr: string;
  durationMs: number;
};

export type CustomSnoozePreset = SnoozePreset & { userId: string };

export const SNOOZE_PRESETS: SnoozePreset[] = [
  { id: "1h", label: "1 hour", labelFr: "1 heure", durationMs: 60 * 60 * 1000 },
  { id: "3h", label: "3 hours", labelFr: "3 heures", durationMs: 3 * 60 * 60 * 1000 },
  { id: "tomorrow", label: "Tomorrow 9am", labelFr: "Demain 9h", durationMs: 0 },
  { id: "next-week", label: "Next week", labelFr: "Semaine prochaine", durationMs: 0 },
  { id: "weekend", label: "This weekend", labelFr: "Ce week-end", durationMs: 0 },
];

export const SNOOZE_CUSTOM_KEY = "misfits:custom-snooze-presets";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

function loadAllCustomSnoozePresets(): CustomSnoozePreset[] {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(SNOOZE_CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch { return []; }
}

export function loadCustomSnoozePresets(userId: string): CustomSnoozePreset[] {
  return loadAllCustomSnoozePresets().filter((p) => p.userId === userId);
}

export function saveCustomSnoozePreset(userId: string, preset: SnoozePreset): CustomSnoozePreset[] {
  const storage = safeStorage();
  if (!storage) return [];
  const all = loadAllCustomSnoozePresets().filter(
    (p) => !(p.userId === userId && p.id === preset.id),
  );
  const custom: CustomSnoozePreset = { ...preset, userId };
  all.push(custom);
  storage.setItem(SNOOZE_CUSTOM_KEY, JSON.stringify(all));
  return loadCustomSnoozePresets(userId);
}

export function deleteCustomSnoozePreset(userId: string, presetId: string): void {
  const storage = safeStorage();
  if (!storage) return;
  const existing = loadCustomSnoozePresets(userId).filter((p) => p.id !== presetId);
  storage.setItem(SNOOZE_CUSTOM_KEY, JSON.stringify(existing));
}

export function getSnoozePresets(userId: string): SnoozePreset[] {
  const custom = loadCustomSnoozePresets(userId);
  return [...SNOOZE_PRESETS, ...custom];
}

export function computeSnoozeUntil(preset: SnoozePreset, now = new Date()): Date {
  if (preset.durationMs > 0) {
    return new Date(now.getTime() + preset.durationMs);
  }

  const result = new Date(now);
  result.setMinutes(0, 0, 0);

  switch (preset.id) {
    case "tomorrow":
      result.setDate(result.getDate() + 1);
      result.setHours(9);
      break;
    case "next-week": {
      const daysUntilMonday = (8 - result.getDay()) % 7 || 7;
      result.setDate(result.getDate() + daysUntilMonday);
      result.setHours(9);
      break;
    }
    case "weekend": {
      const daysUntilSaturday = (6 - result.getDay() + 7) % 7;
      result.setDate(result.getDate() + daysUntilSaturday);
      result.setHours(10);
      break;
    }
    default:
      result.setHours(result.getHours() + 1);
  }
  return result;
}
