/**
 * Prefetch email body on row hover (anticipatory loading)
 */

export interface PrefetchEntry {
  emailId: string;
  body: string;
  timestamp: number;
}

const CACHE_TTL_MS = 30_000;
const prefetchCache = new Map<string, PrefetchEntry>();

export function prefetchEmailBody(emailId: string, body: string): void {
  prefetchCache.set(emailId, { emailId, body, timestamp: Date.now() });
}

export function getPrefetchedBody(emailId: string): string | null {
  const entry = prefetchCache.get(emailId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    prefetchCache.delete(emailId);
    return null;
  }
  return entry.body;
}

export function hasPrefetched(emailId: string): boolean {
  return getPrefetchedBody(emailId) !== null;
}

export function clearPrefetchCache(): void {
  prefetchCache.clear();
}

export function removePrefetchEntry(emailId: string): void {
  prefetchCache.delete(emailId);
}

export function getCacheSize(): number {
  return prefetchCache.size;
}

export function cleanExpiredEntries(): number {
  const now = Date.now();
  let removed = 0;
  for (const [id, entry] of prefetchCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      prefetchCache.delete(id);
      removed++;
    }
  }
  return removed;
}
