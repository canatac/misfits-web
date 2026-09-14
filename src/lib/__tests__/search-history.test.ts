import { describe, it, expect } from "vitest";
import {
  createSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
  getRecentSearches,
  getHistorySize,
  isHistoryEmpty,
  hasQuery,
  formatTimestamp,
} from "@/lib/search-history";

describe("search-history", () => {
  it("creates empty history", () => {
    const h = createSearchHistory();
    expect(h.entries).toEqual([]);
    expect(h.maxSize).toBe(10);
  });

  it("adds query with FIFO eviction", () => {
    let h = createSearchHistory(2);
    h = addSearchQuery(h, "query1");
    h = addSearchQuery(h, "query2");
    h = addSearchQuery(h, "query3");
    expect(getHistorySize(h)).toBe(2);
    expect(h.entries[0].query).toBe("query3");
  });

  it("removes duplicates", () => {
    let h = createSearchHistory();
    h = addSearchQuery(h, "test");
    h = addSearchQuery(h, "test");
    expect(getHistorySize(h)).toBe(1);
  });

  it("removes query", () => {
    let h = createSearchHistory();
    h = addSearchQuery(h, "test");
    h = removeSearchQuery(h, "test");
    expect(getHistorySize(h)).toBe(0);
  });

  it("clears history", () => {
    let h = createSearchHistory();
    h = addSearchQuery(h, "test");
    h = clearSearchHistory(h);
    expect(isHistoryEmpty(h)).toBe(true);
  });

  it("gets recent searches", () => {
    let h = createSearchHistory();
    h = addSearchQuery(h, "first");
    h = addSearchQuery(h, "second");
    const recent = getRecentSearches(h);
    expect(recent[0].query).toBe("second");
  });

  it("checks query existence", () => {
    let h = createSearchHistory();
    h = addSearchQuery(h, "test");
    expect(hasQuery(h, "test")).toBe(true);
    expect(hasQuery(h, "missing")).toBe(false);
  });

  it("formats timestamp", () => {
    expect(formatTimestamp(Date.now())).toBe("Just now");
    expect(formatTimestamp(Date.now() - 5 * 60000)).toBe("5m ago");
  });
});
