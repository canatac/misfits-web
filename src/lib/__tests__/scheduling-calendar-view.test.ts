import { describe, it, expect } from "vitest";
import {
  generateSlots,
  placeItemsInSlots,
  buildScheduleGrid,
  groupByDay,
  findNextAvailableSlot,
  isBusinessHours,
  suggestBusinessHourSlot,
} from "@/lib/scheduling-calendar-view";
import type { ScheduleItem } from "@/lib/scheduling-calendar-view";

function makeItem(id: string, scheduledAt: string): ScheduleItem {
  return { id, label: `Item ${id}`, scheduledAt };
}

describe("generateSlots", () => {
  it("generates hourly slots for a day", () => {
    const slots = generateSlots("2026-03-15T00:00:00Z", "2026-03-16T00:00:00Z", 60);
    expect(slots.length).toBe(24);
  });

  it("generates 30-min slots", () => {
    const slots = generateSlots("2026-03-15T09:00:00Z", "2026-03-15T11:00:00Z", 30);
    expect(slots.length).toBe(4);
  });
});

describe("placeItemsInSlots", () => {
  it("places items into correct slots", () => {
    const slots = generateSlots("2026-03-15T09:00:00Z", "2026-03-15T11:00:00Z", 60);
    const items = [
      makeItem("a", "2026-03-15T09:30:00Z"),
      makeItem("b", "2026-03-15T10:15:00Z"),
    ];
    const placed = placeItemsInSlots(slots, items);
    expect(placed[0].items).toHaveLength(1);
    expect(placed[1].items).toHaveLength(1);
  });

  it("handles empty items", () => {
    const slots = generateSlots("2026-03-15T09:00:00Z", "2026-03-15T11:00:00Z", 60);
    const placed = placeItemsInSlots(slots, []);
    expect(placed.every((s) => s.items.length === 0)).toBe(true);
  });
});

describe("buildScheduleGrid", () => {
  it("returns a populated grid", () => {
    const items = [makeItem("x", "2026-03-15T10:30:00Z")];
    const grid = buildScheduleGrid(
      "day",
      "2026-03-15T00:00:00Z",
      "2026-03-16T00:00:00Z",
      items
    );
    expect(grid.view).toBe("day");
    expect(grid.slots.some((s) => s.items.length > 0)).toBe(true);
  });
});

describe("groupByDay", () => {
  it("groups items by calendar day", () => {
    const items = [
      makeItem("a", "2026-03-15T10:00:00Z"),
      makeItem("b", "2026-03-15T14:00:00Z"),
      makeItem("c", "2026-03-16T09:00:00Z"),
    ];
    const grouped = groupByDay(items);
    expect(grouped.get("2026-03-15")).toHaveLength(2);
    expect(grouped.get("2026-03-16")).toHaveLength(1);
  });
});

describe("findNextAvailableSlot", () => {
  it("finds first future empty slot", () => {
    const grid = buildScheduleGrid(
      "day",
      "2026-03-15T00:00:00Z",
      "2026-03-16T00:00:00Z",
      [],
      60
    );
    const next = findNextAvailableSlot(grid);
    expect(next).not.toBeNull();
    expect(new Date(next!).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("isBusinessHours", () => {
  it("returns true for weekday 10am", () => {
    // Find a known weekday: 2026-03-18 is a Wednesday
    expect(isBusinessHours("2026-03-18T10:00:00Z")).toBe(true);
  });

  it("returns false for evening", () => {
    expect(isBusinessHours("2026-03-18T20:00:00Z")).toBe(false);
  });

  it("returns false for weekend", () => {
    expect(isBusinessHours("2026-03-15T10:00:00Z")).toBe(false); // Sunday
  });
});

describe("suggestBusinessHourSlot", () => {
  it("moves evening to next morning", () => {
    const result = suggestBusinessHourSlot("2026-03-18T20:00:00Z");
    const d = new Date(result);
    expect(d.getHours()).toBe(9);
  });

  it("moves Saturday to Monday", () => {
    const result = suggestBusinessHourSlot("2026-03-14T10:00:00Z"); // Saturday
    const d = new Date(result);
    expect(d.getDay()).toBe(1); // Monday
  });
});
