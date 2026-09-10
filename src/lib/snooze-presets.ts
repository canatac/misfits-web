/**
 * Email snooze presets in toolbar (Issue #464).
 *
 * One-click snooze presets for email triage with keyboard shortcuts.
 */

export interface SnoozePreset {
  id: string;
  label: string;
  shortcut: string; // keyboard shortcut (1-4)
  duration: number; // minutes
  icon?: string;
}

export const SNOOZE_PRESETS: SnoozePreset[] = [
  { id: "later-today", label: "Later today", shortcut: "1", duration: 120, icon: "☀️" },
  { id: "tomorrow", label: "Tomorrow", shortcut: "2", duration: 1440, icon: "🌅" },
  { id: "next-week", label: "Next week", shortcut: "3", duration: 10080, icon: "📅" },
  { id: "in-1-month", label: "In 1 month", shortcut: "4", duration: 43200, icon: "🗓️" },
];

/**
 * Get snooze preset by ID.
 */
export function getSnoozePresetById(id: string): SnoozePreset | undefined {
  return SNOOZE_PRESETS.find((p) => p.id === id);
}

/**
 * Get snooze preset by keyboard shortcut.
 */
export function getSnoozePresetByShortcut(shortcut: string): SnoozePreset | undefined {
  return SNOOZE_PRESETS.find((p) => p.shortcut === shortcut);
}

/**
 * Calculate snooze timestamp from preset.
 */
export function calculateSnoozeTime(preset: SnoozePreset): Date {
  return new Date(Date.now() + preset.duration * 60 * 1000);
}

/**
 * Check if email is currently snoozed.
 */
export function isEmailSnoozed(snoozedUntil: Date | null): boolean {
  if (!snoozedUntil) return false;
  return snoozedUntil > new Date();
}

/**
 * Get remaining snooze time in minutes.
 */
export function getRemainingSnoozeMinutes(snoozedUntil: Date | null): number {
  if (!snoozedUntil) return 0;
  const remaining = snoozedUntil.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 60000));
}

/**
 * Snooze an email with a preset.
 */
export function snoozeEmail(emailId: string, preset: SnoozePreset): { emailId: string; snoozedUntil: Date; preset: SnoozePreset } {
  return {
    emailId,
    snoozedUntil: calculateSnoozeTime(preset),
    preset,
  };
}

/**
 * Unsnooze an email.
 */
export function unsnoozeEmail(emailId: string): { emailId: string; snoozedUntil: null } {
  return {
    emailId,
    snoozedUntil: null,
  };
}

/**
 * Get all snooze presets.
 */
export function getSnoozePresets(): SnoozePreset[] {
  return [...SNOOZE_PRESETS];
}

/**
 * Format snooze duration for display.
 */
export function formatSnoozeDuration(preset: SnoozePreset): string {
  const minutes = preset.duration;
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
  return `${Math.floor(minutes / 10080)}w`;
}

/**
 * Check if snooze menu should be visible (when email is selected).
 */
export function shouldShowSnoozeMenu(selectedEmailId: string | null): boolean {
  return selectedEmailId !== null;
}
