import { describe, it, expect } from "vitest";
import {
  createThreadExpansionState,
  expandThread,
  collapseThread,
  isThreadExpanded,
  pruneExpired,
  getExpandedForFolder,
  loadThreadExpansion,
  saveThreadExpansion,
  EXPIRY_MS,
} from "@/lib/thread-persistence";

describe("thread-persistence", () => {
  it("creates empty state", () => {
    const s = createThreadExpansionState();
    expect(s.entries).toEqual([]);
  });

  it("expands thread", () => {
    let s = createThreadExpansionState();
    s = expandThread(s, "t1", "inbox");
    expect(isThreadExpanded(s, "t1", "inbox")).toBe(true);
  });

  it("collapses thread", () => {
    let s = createThreadExpansionState();
    s = expandThread(s, "t1", "inbox");
    s = collapseThread(s, "t1", "inbox");
    expect(isThreadExpanded(s, "t1", "inbox")).toBe(false);
  });

  it("checks expanded", () => {
    let s = createThreadExpansionState();
    expect(isThreadExpanded(s, "t1", "inbox")).toBe(false);
    s = expandThread(s, "t1", "inbox");
    expect(isThreadExpanded(s, "t1", "inbox")).toBe(true);
  });

  it("prunes expired", () => {
    let s = createThreadExpansionState();
    s = expandThread(s, "t1", "inbox");
    // Manually set to expired
    s.entries[0].expandedAt = Date.now() - EXPIRY_MS - 1000;
    s = pruneExpired(s);
    expect(s.entries).toHaveLength(0);
  });

  it("gets expanded for folder", () => {
    let s = createThreadExpansionState();
    s = expandThread(s, "t1", "inbox");
    s = expandThread(s, "t2", "sent");
    expect(getExpandedForFolder(s, "inbox")).toEqual(["t1"]);
  });

  it("loads from localStorage", () => {
    const s = loadThreadExpansion();
    expect(s.entries).toBeDefined();
  });

  it("saves to localStorage", () => {
    let s = createThreadExpansionState();
    s = expandThread(s, "t1", "inbox");
    saveThreadExpansion(s);
    const loaded = loadThreadExpansion();
    expect(isThreadExpanded(loaded, "t1", "inbox")).toBe(true);
  });
});
