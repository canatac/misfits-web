/**
 * Desktop notification preferences (Issue #414).
 *
 * Per-folder notification toggles, quiet hours, VIP-only mode,
 * and browser permission management.
 */

export interface NotificationPreferences {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string;   // HH:mm
  vipOnly: boolean;
  soundEnabled: boolean;
  folderSettings: Record<string, boolean>;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  vipOnly: false,
  soundEnabled: true,
  folderSettings: {
    inbox: true,
    sent: false,
    archive: false,
    trash: false,
  },
};

export const STORAGE_KEY = "misfits_notification_prefs";

/**
 * Load notification preferences from localStorage.
 */
export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save notification preferences to localStorage.
 */
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Check if currently in quiet hours.
 */
export function isQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

/**
 * Check if notification should be shown for folder.
 */
export function shouldNotifyForFolder(prefs: NotificationPreferences, folder: string): boolean {
  if (!prefs.enabled) return false;
  if (isQuietHours(prefs)) return false;
  return prefs.folderSettings[folder] ?? false;
}

/**
 * Check if browser notifications are supported.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get browser notification permission.
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Request browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return await Notification.requestPermission();
}
