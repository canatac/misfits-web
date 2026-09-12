/**
 * Email snooze preset utilities.
 *
 * `getSnoozePresets` returns the list of preset snooze durations,
 * `formatSnoozeDuration` humanizes a duration for display,
 * `resolveSnoozeTimestamp` computes the future wake timestamp from a
 * preset or custom offset, and `findPresetByOffset` matches a raw
 * millisecond offset back to a known preset.
 */

export interface SnoozePreset {
  id: string;
  label: string;
  /** Human-readable short label (e.g. "1h") */
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

/**
 * Return all available snooze presets (ordered shortest → longest).
 */
export function getSnoozePresets(): SnoozePreset[] {
  return SNOOZE_PRESETS;
}

/**
 * Look up a preset by its ID.
 */
export function getPresetById(id: string): SnoozePreset | undefined {
  return PRESET_MAP.get(id);
}

/**
 * Format an offset in milliseconds into a human-readable duration string.
 */
export function formatSnoozeDuration(offsetMs: number): string {
  if (offsetMs <= 0) return "Invalid duration";

  const minutes = Math.round(offsetMs / 60_000);
  const hours = Math.round(offsetMs / 3_600_000);
  const days = Math.round(offsetMs / 86_400_000);
  const weeks = Math.round(offsetMs / (86_400_000 * 7));
  const months = Math.round(offsetMs / (86_400_000 * 30));

  if (months >= 1 && Math.abs(offsetMs - months * 86_400_000 * 30) < 86_400_000) {
    return months === 1 ? "1 month" : `${months} months`;
  }
  if (weeks >= 1 && Math.abs(offsetMs - weeks * 86_400_000 * 7) < 3_600_000) {
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }
  if (days >= 1 && Math.abs(offsetMs - days * 86_400_000) < 1_800_000) {
    return days === 1 ? "1 day" : `${days} days`;
  }
  if (hours >= 1 && Math.abs(offsetMs - hours * 3_600_000) < 180_000) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes >= 1) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  return `${Math.round(offsetMs / 1000)} seconds`;
}

/**
 * Resolve a wake timestamp from a preset ID and an optional reference time.
 * Returns undefined for unknown preset IDs.
 */
export function resolveSnoozeTimestamp(
  presetId: string,
  from: number = Date.now(),
): number | undefined {
  const preset = PRESET_MAP.get(presetId);
  if (!preset) return undefined;
  return from + preset.offsetMs;
}

/**
 * Attempt to match a raw offset to a known preset.
 * Returns undefined when no preset matches exactly.
 */
export function findPresetByOffset(offsetMs: number): SnoozePreset | undefined {
  return SNOOZE_PRESETS.find((p) => p.offsetMs === offsetMs);
}
