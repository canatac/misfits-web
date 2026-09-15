/**
 * Email snooze preset utilities.
 */
export interface SnoozePreset {
  id: string;
  label: string;
  shortLabel: string;
  offsetMs: number;
}

export const SNOOZE_PRESETS: SnoozePreset[] = [
  { id: "1hour", label: "Later today", shortLabel: "1h", offsetMs: 60 * 60 * 1000 },
  { id: "tomorrow", label: "Tomorrow", shortLabel: "Tom", offsetMs: 24 * 60 * 60 * 1000 },
  { id: "3days", label: "In 3 days", shortLabel: "3d", offsetMs: 3 * 24 * 60 * 60 * 1000 },
  { id: "1week", label: "Next week", shortLabel: "1w", offsetMs: 7 * 24 * 60 * 60 * 1000 },
  { id: "2weeks", label: "In 2 weeks", shortLabel: "2w", offsetMs: 14 * 24 * 60 * 60 * 1000 },
  { id: "1month", label: "Next month", shortLabel: "1mo", offsetMs: 30 * 24 * 60 * 60 * 1000 },
];

const PRESET_MAP = new Map<string, SnoozePreset>(
  SNOOZE_PRESETS.map((p) => [p.id, p]),
);

const DURATION_THRESHOLDS = [
  { limit: 60_000, unit: "second", ms: 1000 },
  { limit: 3_600_000, unit: "minute", ms: 60_000 },
  { limit: 86_400_000, unit: "hour", ms: 3_600_000 },
  { limit: 86_400_000 * 7, unit: "day", ms: 86_400_000 },
  { limit: 86_400_000 * 30, unit: "week", ms: 86_400_000 * 7 },
  { limit: Infinity, unit: "month", ms: 86_400_000 * 30 },
];

export function getSnoozePresets(): SnoozePreset[] {
  return SNOOZE_PRESETS;
}

export function getPresetById(id: string): SnoozePreset | undefined {
  return PRESET_MAP.get(id);
}

export function formatSnoozeDuration(offsetMs: number): string {
  if (offsetMs <= 0) return "Invalid duration";
  for (const { limit, unit, ms } of DURATION_THRESHOLDS) {
    if (offsetMs < limit) {
      const value = Math.round(offsetMs / ms);
      return value === 1 ? `1 ${unit}` : `${value} ${unit}s`;
    }
  }
  return "Invalid duration";
}

export function resolveSnoozeTimestamp(
  presetId: string,
  from: number = Date.now(),
): number | undefined {
  const preset = PRESET_MAP.get(presetId);
  if (!preset) return undefined;
  return from + preset.offsetMs;
}

export function findPresetByOffset(offsetMs: number): SnoozePreset | undefined {
  return SNOOZE_PRESETS.find((p) => p.offsetMs === offsetMs);
}
