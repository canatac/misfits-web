import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OfflineManager,
  getOfflineManager,
  type OfflineState,
} from "../pwa-offline";

declare const window: {
  navigator: Navigator;
  localStorage: Storage;
  addEventListener: (event: string, fn: () => void) => void;
  removeEventListener: (event: string, fn: () => void) => void;
};

let listeners: Record<string, Array<() => void>> = {};

function makeNavigator(onLine: boolean): Navigator {
  return {
    onLine,
    serviceWorker: { register: vi.fn().mockResolvedValue({ scope: "/" }) },
  } as unknown as Navigator;
}

const store = new Map<string, string>();

function mockStorage(): Storage {
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  };
}

describe("OfflineManager", () => {
  let mgr: OfflineManager;

  beforeEach(() => {
    store.clear();
    listeners = {};
    (global as unknown as { window: typeof window }).window = {
      navigator: makeNavigator(true) as unknown as Navigator,
      localStorage: mockStorage(),
      addEventListener: (event: string, fn: () => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event]!.push(fn);
      },
      removeEventListener: () => {},
    };
    OfflineManager.resetInstance();
    mgr = OfflineManager.getInstance();
  });

  afterEach(() => {
    OfflineManager.resetInstance();
  });

  it("starts online when navigator.onLine is true", () => {
    expect(mgr.isOnline).toBe(true);
    expect(mgr.state).toBe("online");
  });

  it("tracks offline state change", () => {
    expect(mgr.isOnline).toBe(true);
    listeners["offline"]?.forEach((fn) => fn());
    expect(mgr.isOffline).toBe(true);
    expect(mgr.state).toBe("offline");
  });

  it("tracks online state change", () => {
    listeners["offline"]?.forEach((fn) => fn());
    expect(mgr.isOffline).toBe(true);
    listeners["online"]?.forEach((fn) => fn());
    expect(mgr.isOnline).toBe(true);
  });

  it("notifies subscribers on state change", () => {
    const spy = vi.fn();
    mgr.subscribe(spy);
    listeners["offline"]?.forEach((fn) => fn());
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ state: "offline" }));
  });

  it("persists state to localStorage", () => {
    listeners["offline"]?.forEach((fn) => fn());
    expect(store.get("misfits:offline-state")).toBe("offline");
  });

  it("returns unsubscribe function", () => {
    const spy = vi.fn();
    const unsub = mgr.subscribe(spy);
    unsub();
    listeners["offline"]?.forEach((fn) => fn());
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("getOfflineManager", () => {
  it("returns singleton", () => {
    OfflineManager.resetInstance();
    const a = getOfflineManager();
    const b = getOfflineManager();
    expect(a).toBe(b);
  });
});
