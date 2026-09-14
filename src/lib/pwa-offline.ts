/**
 * PWA offline mode utilities (Issue #520).
 *
 * Service worker registration, offline status detection, and sync management
 * for offline-first email access.
 */

export type OnlineStatus = "online" | "offline" | "unknown";

export interface PendingAction {
  id: string;
  type: "send" | "delete" | "archive" | "markRead" | "star";
  payload: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

export interface OfflineCache {
  emails: CachedEmail[];
  lastSync: string;
  maxEmails: number;
}

export interface CachedEmail {
  id: string;
  subject: string;
  from: string;
  preview: string;
  date: string;
  cachedAt: string;
}

export interface ServiceWorkerRegistrationResult {
  success: boolean;
  error?: string;
}

const PENDING_ACTIONS_KEY = "misfits_pending_actions";
const OFFLINE_CACHE_KEY = "misfits_offline_cache";

/**
 * Register the service worker.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistrationResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { success: false, error: "Service workers not supported" };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Unregister the service worker.
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.unregister();
  }
}

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

/**
 * Get the current online status.
 */
export function getOnlineStatus(): OnlineStatus {
  if (typeof window === "undefined") return "unknown";
  return navigator.onLine ? "online" : "offline";
}

/**
 * Add a pending action to the queue.
 */
export function addPendingAction(action: Omit<PendingAction, "id" | "timestamp" | "retryCount">): PendingAction {
  const pendingAction: PendingAction = {
    ...action,
    id: `action-${Date.now()}`,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  const existing = getPendingActions();
  existing.push(pendingAction);
  savePendingActions(existing);

  return pendingAction;
}

/**
 * Get all pending actions.
 */
export function getPendingActions(): PendingAction[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save pending actions to localStorage.
 */
function savePendingActions(actions: PendingAction[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
}

/**
 * Remove a pending action from the queue.
 */
export function removePendingAction(actionId: string): void {
  const actions = getPendingActions().filter((a) => a.id !== actionId);
  savePendingActions(actions);
}

/**
 * Clear all pending actions.
 */
export function clearPendingActions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_ACTIONS_KEY);
}

/**
 * Increment retry count for a pending action.
 */
export function incrementRetryCount(actionId: string): void {
  const actions = getPendingActions();
  const action = actions.find((a) => a.id === actionId);
  if (action) {
    action.retryCount++;
    savePendingActions(actions);
  }
}

/**
 * Cache emails for offline access.
 */
export function cacheEmails(emails: CachedEmail[], maxEmails: number = 100): void {
  const cache: OfflineCache = {
    emails: emails.slice(0, maxEmails),
    lastSync: new Date().toISOString(),
    maxEmails,
  };

  if (typeof window === "undefined") return;
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
}

/**
 * Get cached emails.
 */
export function getCachedEmails(): CachedEmail[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(OFFLINE_CACHE_KEY);
  if (!stored) return [];
  const cache: OfflineCache = JSON.parse(stored);
  return cache.emails;
}

/**
 * Get the last sync timestamp.
 */
export function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(OFFLINE_CACHE_KEY);
  if (!stored) return null;
  const cache: OfflineCache = JSON.parse(stored);
  return cache.lastSync;
}

/**
 * Clear the offline cache.
 */
export function clearOfflineCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OFFLINE_CACHE_KEY);
}

/**
 * Check if offline mode is available (has cached data).
 */
export function isOfflineModeAvailable(): boolean {
  return getCachedEmails().length > 0;
}

/**
 * Get the offline status indicator text.
 */
export function getOfflineStatusText(status: OnlineStatus): string {
  const texts: Record<OnlineStatus, string> = {
    online: "Online",
    offline: "Offline",
    unknown: "Unknown",
  };
  return texts[status];
}

/**
 * Get the offline status color.
 */
export function getOfflineStatusColor(status: OnlineStatus): string {
  const colors: Record<OnlineStatus, string> = {
    online: "text-green-500",
    offline: "text-red-500",
    unknown: "text-gray-500",
  };
  return colors[status];
}

/**
 * Check if an action can be performed offline.
 */
export function canPerformOffline(actionType: PendingAction["type"]): boolean {
  const offlineActions: PendingAction["type"][] = ["delete", "archive", "markRead", "star"];
  return offlineActions.includes(actionType);
}

/**
 * Get pending actions count.
 */
export function getPendingActionsCount(): number {
  return getPendingActions().length;
}

/**
 * Check if there are pending actions to sync.
 */
export function hasPendingActions(): boolean {
  return getPendingActions().length > 0;
}
