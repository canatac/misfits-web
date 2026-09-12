/**
 * pwa-offline.ts — PWA offline detection and state management for misfits.ai Mail.
 *
 * Provides a singleton OfflineManager that tracks connectivity state,
 * registers a service worker, and dispatches events when the app goes
 * online/offline. UI components subscribe to stay in sync.
 */

export type OfflineState = "online" | "offline" | "unknown";

export interface OfflineEvent {
  state: OfflineState;
  timestamp: number;
}

export type OfflineListener = (event: OfflineEvent) => void;

const OFFLINE_STATE_KEY = "misfits:offline-state";

function safeWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window;
}

export class OfflineManager {
  private static instance: OfflineManager | null = null;

  private _state: OfflineState = "unknown";
  private listeners = new Set<OfflineListener>();
  private boundOnline: (() => void) | null = null;
  private boundOffline: (() => void) | null = null;

  private constructor() {
    this.loadPersistedState();
    this.bindEvents();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  static resetInstance(): void {
    if (OfflineManager.instance) {
      OfflineManager.instance.destroy();
      OfflineManager.instance = null;
    }
  }

  get state(): OfflineState {
    return this._state;
  }

  get isOffline(): boolean {
    return this._state === "offline";
  }

  get isOnline(): boolean {
    return this._state === "online";
  }

  subscribe(listener: OfflineListener): () => void {
    this.listeners.add(listener);
    listener({ state: this._state, timestamp: Date.now() });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private loadPersistedState(): void {
    const w = safeWindow();
    if (!w) return;
    try {
      const stored = w.localStorage.getItem(OFFLINE_STATE_KEY);
      if (stored === "online" || stored === "offline") {
        this._state = stored;
      }
    } catch {
      // ignore storage errors
    }
  }

  private persistState(): void {
    const w = safeWindow();
    if (!w) return;
    try {
      w.localStorage.setItem(OFFLINE_STATE_KEY, this._state);
    } catch {
      // ignore storage errors
    }
  }

  private setState(newState: OfflineState): void {
    if (this._state === newState) return;
    this._state = newState;
    this.persistState();
    const event: OfflineEvent = { state: newState, timestamp: Date.now() };
    this.listeners.forEach((l) => l(event));
  }

  private bindEvents(): void {
    const w = safeWindow();
    if (!w) return;
    this.boundOnline = () => this.setState("online");
    this.boundOffline = () => this.setState("offline");
    w.addEventListener("online", this.boundOnline);
    w.addEventListener("offline", this.boundOffline);

    if (w.navigator && typeof w.navigator.onLine === "boolean") {
      this.setState(w.navigator.onLine ? "online" : "offline");
    }
  }

  destroy(): void {
    const w = safeWindow();
    if (w) {
      if (this.boundOnline) w.removeEventListener("online", this.boundOnline);
      if (this.boundOffline) w.removeEventListener("offline", this.boundOffline);
    }
    this.listeners.clear();
    this.boundOnline = null;
    this.boundOffline = null;
  }
}

export function getOfflineManager(): OfflineManager {
  return OfflineManager.getInstance();
}

export async function registerServiceWorker(
  scriptURL: string = "/sw.js",
): Promise<ServiceWorkerRegistration | null> {
  const w = safeWindow();
  if (!w || !("serviceWorker" in w.navigator)) return null;
  try {
    const reg = await w.navigator.serviceWorker.register(scriptURL, {
      scope: "/",
    });
    return reg;
  } catch {
    return null;
  }
}
