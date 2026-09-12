import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  prefetchEmailBody,
  getPrefetchedBody,
  hasPrefetched,
  clearPrefetchCache,
  removePrefetchEntry,
  getCacheSize,
  cleanExpiredEntries,
} from '../prefetch-bodies';

describe('prefetch-bodies', () => {
  beforeEach(() => {
    clearPrefetchCache();
  });

  describe('prefetchEmailBody', () => {
    it('stores email body in cache', () => {
      prefetchEmailBody('email-1', 'Hello world');
      expect(getPrefetchedBody('email-1')).toBe('Hello world');
    });

    it('overwrites existing entry', () => {
      prefetchEmailBody('email-1', 'First');
      prefetchEmailBody('email-1', 'Second');
      expect(getPrefetchedBody('email-1')).toBe('Second');
    });

    it('stores multiple entries', () => {
      prefetchEmailBody('email-1', 'Body 1');
      prefetchEmailBody('email-2', 'Body 2');
      expect(getPrefetchedBody('email-1')).toBe('Body 1');
      expect(getPrefetchedBody('email-2')).toBe('Body 2');
    });
  });

  describe('getPrefetchedBody', () => {
    it('returns null for non-cached email', () => {
      expect(getPrefetchedBody('nonexistent')).toBeNull();
    });

    it('returns null for expired entries', () => {
      let fakeTime = 1_000_000;
      const spy = vi.spyOn(Date, 'now').mockImplementation(() => fakeTime);
      prefetchEmailBody('email-1', 'Hello');
      fakeTime += 31_000;
      expect(getPrefetchedBody('email-1')).toBeNull();
      spy.mockRestore();
    });
  });

  describe('hasPrefetched', () => {
    it('returns true when cached', () => {
      prefetchEmailBody('email-1', 'Hello');
      expect(hasPrefetched('email-1')).toBe(true);
    });

    it('returns false when not cached', () => {
      expect(hasPrefetched('nonexistent')).toBe(false);
    });
  });

  describe('clearPrefetchCache', () => {
    it('removes all entries', () => {
      prefetchEmailBody('email-1', 'A');
      prefetchEmailBody('email-2', 'B');
      clearPrefetchCache();
      expect(getCacheSize()).toBe(0);
    });
  });

  describe('removePrefetchEntry', () => {
    it('removes specific entry', () => {
      prefetchEmailBody('email-1', 'A');
      prefetchEmailBody('email-2', 'B');
      removePrefetchEntry('email-1');
      expect(getPrefetchedBody('email-1')).toBeNull();
      expect(getPrefetchedBody('email-2')).toBe('B');
    });
  });

  describe('getCacheSize', () => {
    it('returns correct count', () => {
      expect(getCacheSize()).toBe(0);
      prefetchEmailBody('email-1', 'A');
      expect(getCacheSize()).toBe(1);
      prefetchEmailBody('email-2', 'B');
      expect(getCacheSize()).toBe(2);
    });
  });

  describe('cleanExpiredEntries', () => {
    it('removes only expired entries', () => {
      let fakeTime = 1_000_000;
      const spy = vi.spyOn(Date, 'now').mockImplementation(() => fakeTime);
      prefetchEmailBody('email-1', 'Old');
      fakeTime += 15_000;
      prefetchEmailBody('email-2', 'New');
      fakeTime += 20_000;

      const removed = cleanExpiredEntries();
      expect(removed).toBe(1);
      expect(getPrefetchedBody('email-1')).toBeNull();
      expect(getPrefetchedBody('email-2')).toBe('New');
      spy.mockRestore();
    });
  });
});
