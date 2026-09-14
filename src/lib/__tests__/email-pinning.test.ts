/**
 * Unit tests for email pinning (localStorage-backed API).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  PINNED_KEY,
  loadPinned,
  savePinned,
  isPinned,
  pinEmail,
  unpinEmail,
  togglePin,
  sortByPinned,
  type PinnedMap,
} from "@/lib/email-pinning";

describe("email-pinning", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadPinned / savePinned", () => {
    it("returns empty map when nothing stored", () => {
      expect(loadPinned()).toEqual({});
    });

    it("persists and retrieves a pinned map", () => {
      const map: PinnedMap = { email1: "2026-01-01T00:00:00.000Z" };
      savePinned(map);
      expect(loadPinned()).toEqual(map);
    });

    it("ignores malformed JSON", () => {
      localStorage.setItem(PINNED_KEY, "not json");
      expect(loadPinned()).toEqual({});
    });

    it("ignores non-object JSON", () => {
      localStorage.setItem(PINNED_KEY, "42");
      expect(loadPinned()).toEqual({});
    });
  });

  describe("isPinned", () => {
    it("returns false when email is not pinned", () => {
      expect(isPinned("email1")).toBe(false);
    });

    it("returns true when email is pinned", () => {
      pinEmail("email1");
      expect(isPinned("email1")).toBe(true);
    });
  });

  describe("pinEmail", () => {
    it("pins an email and returns updated map", () => {
      const map = pinEmail("email1");
      expect(map.email1).toBeDefined();
      expect(isPinned("email1")).toBe(true);
    });

    it("does not duplicate pin", () => {
      pinEmail("email1");
      pinEmail("email1");
      expect(Object.keys(loadPinned())).toHaveLength(1);
    });

    it("persists to localStorage", () => {
      pinEmail("email1");
      const raw = localStorage.getItem(PINNED_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.email1).toBeDefined();
    });
  });

  describe("unpinEmail", () => {
    it("removes a pinned email", () => {
      pinEmail("email1");
      unpinEmail("email1");
      expect(isPinned("email1")).toBe(false);
    });

    it("is a no-op when email not pinned", () => {
      const result = unpinEmail("nonexistent");
      expect(result).toEqual({});
    });
  });

  describe("togglePin", () => {
    it("pins when currently unpinned", () => {
      const result = togglePin("email1");
      expect(result.pinned).toBe(true);
      expect(isPinned("email1")).toBe(true);
    });

    it("unpins when currently pinned", () => {
      pinEmail("email1");
      const result = togglePin("email1");
      expect(result.pinned).toBe(false);
      expect(isPinned("email1")).toBe(false);
    });
  });

  describe("sortByPinned", () => {
    it("places pinned items first", () => {
      pinEmail("email2");
      const items = [
        { id: "email1", date: "2026-01-03T00:00:00Z" },
        { id: "email2", date: "2026-01-01T00:00:00Z" },
        { id: "email3", date: "2026-01-02T00:00:00Z" },
      ];
      const sorted = sortByPinned(items);
      expect(sorted[0].id).toBe("email2");
    });

    it("sorts within pinned and unpinned groups by date desc", () => {
      pinEmail("email1");
      pinEmail("email3");
      const items = [
        { id: "email1", date: "2026-01-01T00:00:00Z" },
        { id: "email2", date: "2026-01-04T00:00:00Z" },
        { id: "email3", date: "2026-01-03T00:00:00Z" },
      ];
      const sorted = sortByPinned(items);
      expect(sorted.map((i) => i.id)).toEqual(["email3", "email1", "email2"]);
    });

    it("does not mutate the input array", () => {
      const items = [{ id: "email1", date: "2026-01-01T00:00:00Z" }];
      const copy = [...items];
      sortByPinned(items);
      expect(items).toEqual(copy);
    });
  });
});
