import { describe, expect, it, vi, beforeEach } from "vitest";
import { EmailPrefetchCache, PrefetchEntry } from "../email-prefetch";

describe("EmailPrefetchCache", () => {
  let cache: EmailPrefetchCache;

  beforeEach(() => {
    cache = new EmailPrefetchCache({ maxCache: 5, cancelDelay: 200 });
  });

  describe("get/set", () => {
    it("stores and retrieves data by id", () => {
      cache.set("email-1", { body: "hello" });
      expect(cache.get("email-1")).toEqual({ body: "hello" });
    });

    it("returns undefined for missing key", () => {
      expect(cache.get("missing")).toBeUndefined();
    });

    it("returns correct size", () => {
      expect(cache.size()).toBe(0);
      cache.set("a", 1);
      expect(cache.size()).toBe(1);
      cache.set("b", 2);
      expect(cache.size()).toBe(2);
    });

    it("reports has() correctly", () => {
      expect(cache.has("x")).toBe(false);
      cache.set("x", 1);
      expect(cache.has("x")).toBe(true);
    });
  });

  describe("LRU eviction", () => {
    it("evicts oldest entry when max exceeded", () => {
      const c = new EmailPrefetchCache({ maxCache: 3 });
      c.set("a", 1);
      c.set("b", 2);
      c.set("c", 3);
      c.set("d", 4); // should evict "a"

      expect(c.has("a")).toBe(false);
      expect(c.has("b")).toBe(true);
      expect(c.has("c")).toBe(true);
      expect(c.has("d")).toBe(true);
      expect(c.size()).toBe(3);
    });

    it("does not evict when updating existing key", () => {
      const c = new EmailPrefetchCache({ maxCache: 3 });
      c.set("a", 1);
      c.set("b", 2);
      c.set("c", 3);
      c.set("a", 10); // update — no eviction

      expect(c.size()).toBe(3);
      expect(c.get("a")).toBe(10);
    });
  });

  describe("clear", () => {
    it("removes all entries", () => {
      cache.set("a", 1);
      cache.set("b", 2);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.has("a")).toBe(false);
    });
  });

  describe("cancel/cancelAll", () => {
    it("cancelAll clears pending fetches without throwing", () => {
      cache.set("a", 1);
      expect(() => cache.cancelAll()).not.toThrow();
    });
  });
});
