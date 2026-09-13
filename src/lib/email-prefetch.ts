export interface PrefetchEntry {
  id: string;
  data: unknown;
  timestamp: number;
}

export interface PrefetchOptions {
  maxCache?: number;
  cancelDelay?: number; // ms
}

export class EmailPrefetchCache {
  private cache = new Map<string, PrefetchEntry>();
  private pending = new Map<string, AbortController>();
  private maxCache: number;
  private cancelDelay: number;

  constructor(opts: PrefetchOptions = {}) {
    this.maxCache = opts.maxCache ?? 5;
    this.cancelDelay = opts.cancelDelay ?? 200;
  }

  get(id: string): unknown | undefined {
    const entry = this.cache.get(id);
    if (!entry) return undefined;
    // Move to end (LRU)
    this.cache.delete(id);
    this.cache.set(id, entry);
    return entry.data;
  }

  set(id: string, data: unknown): void {
    if (this.cache.has(id)) {
      this.cache.delete(id);
    } else if (this.cache.size >= this.maxCache) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(id, { id, data, timestamp: Date.now() });
  }

  has(id: string): boolean {
    return this.cache.has(id);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getOrFetch(id: string, fetcher: (signal: AbortSignal) => Promise<unknown>): { data: unknown | undefined; fetched: boolean } {
    const cached = this.get(id);
    if (cached !== undefined) {
      return { data: cached, fetched: true };
    }

    // Cancel pending for this ID if exists
    const existing = this.pending.get(id);
    if (existing) existing.abort();

    const controller = new AbortController();
    this.pending.set(id, controller);

    const delay = this.cancelDelay;
    const cancelled = new Promise<never>((_, reject) => {
      setTimeout(() => {
        if (controller.signal.aborted) return;
        reject(new Error("cancelled"));
      }, delay);
    });

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          this.set(id, data);
          this.pending.delete(id);
        }
      })
      .catch(() => {
        this.pending.delete(id);
      });

    return { data: undefined, fetched: false };
  }

  cancel(id: string): void {
    const ctrl = this.pending.get(id);
    if (ctrl) {
      ctrl.abort();
      this.pending.delete(id);
    }
  }

  cancelAll(): void {
    for (const ctrl of this.pending.values()) {
      ctrl.abort();
    }
    this.pending.clear();
  }
}

let globalCache: EmailPrefetchCache | null = null;

export function getGlobalPrefetchCache(): EmailPrefetchCache {
  if (!globalCache) {
    globalCache = new EmailPrefetchCache();
  }
  return globalCache;
}

export function resetGlobalPrefetchCache(): void {
  if (globalCache) {
    globalCache.cancelAll();
  }
  globalCache = null;
}
