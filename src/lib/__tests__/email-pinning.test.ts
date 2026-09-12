import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isPinned, loadPinned, pinEmail, PINNED_KEY,
  savePinned, sortByPinned, togglePin, unpinEmail,
} from "@/lib/email-pinning";

describe("email-pinning", () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it("pinEmail stores the email id with timestamp", () => {
    pinEmail("abc");
    expect(loadPinned().abc).toBeDefined();
  });

  it("isPinned returns true after pinning", () => {
    expect(isPinned("abc")).toBe(false);
    pinEmail("abc");
    expect(isPinned("abc")).toBe(true);
  });

  it("unpinEmail removes the email id", () => {
    pinEmail("abc");
    unpinEmail("abc");
    expect(isPinned("abc")).toBe(false);
  });

  it("togglePin toggles pin state", () => {
    expect(togglePin("abc").pinned).toBe(true);
    expect(togglePin("abc").pinned).toBe(false);
  });

  it("sortByPinned puts pinned items first, then sorts by date desc", () => {
    const items = [
      { id: "a", date: "2026-09-01T08:00:00.000Z" },
      { id: "b", date: "2026-09-03T08:00:00.000Z" },
      { id: "c", date: "2026-09-02T08:00:00.000Z" },
    ];
    pinEmail("a");
    const sorted = sortByPinned(items);
    expect(sorted[0].id).toBe("a");
    expect(sorted[1].id).toBe("b");
    expect(sorted[2].id).toBe("c");
  });

  it("savePinned persists to localStorage", () => {
    savePinned({ abc: "2026-09-01T00:00:00.000Z" });
    expect(localStorage.getItem(PINNED_KEY)).toBe('{"abc":"2026-09-01T00:00:00.000Z"}');
  });
});
