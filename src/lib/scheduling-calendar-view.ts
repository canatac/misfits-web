/**
 * Scheduling Calendar View (Issue #475).
 *
 * Visual send-later — helpers for rendering a calendar-style scheduling
 * interface. Computes time slots, groups send-later candidates by date,
 * and generates day/week/month grid data for the scheduling UI.
 */

export type SchedulingView = "day" | "week" | "month";

/** A scheduled item to be sent later. */
export interface ScheduleItem {
  /** Unique id. */
  id: string;
  /** Display label. */
  label: string;
  /** ISO datetime for scheduled send. */
  scheduledAt: string;
  /** Optional color tag. */
  color?: string;
}

/** A single time slot in the calendar grid. */
export interface TimeSlot {
  /** ISO datetime for this slot. */
  start: string;
  /** ISO datetime for end of slot. */
  end: string;
  /** Items scheduled in this slot. */
  items: ScheduleItem[];
  /** Whether this slot is in the past. */
  isPast: boolean;
}

/** Calendar grid for a given period. */
export interface ScheduleGrid {
  /** View type. */
  view: SchedulingView;
  /** ISO start of period. */
  periodStart: string;
  /** ISO end of period. */
  periodEnd: string;
  /** Time slots in the grid. */
  slots: TimeSlot[];
}

/** Default slot duration in minutes. */
export const DEFAULT_SLOT_MINUTES = 60;

/**
 * Generate time slots for a given date range.
 *
 * @param periodStart ISO start datetime.
 * @param periodEnd ISO end datetime.
 * @param slotMinutes Duration of each slot in minutes.
 * @returns Array of empty time slots.
 */
export function generateSlots(
  periodStart: string,
  periodEnd: string,
  slotMinutes: number = DEFAULT_SLOT_MINUTES
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const now = new Date();

  const slotMs = slotMinutes * 60 * 1000;
  let current = new Date(start);

  while (current < end) {
    const slotEnd = new Date(current.getTime() + slotMs);
    slots.push({
      start: current.toISOString(),
      end: slotEnd.toISOString(),
      items: [],
      isPast: slotEnd < now,
    });
    current = slotEnd;
  }

  return slots;
}

/**
 * Place schedule items into matching time slots.
 *
 * @param slots Target slots.
 * @param items Items to place.
 * @returns New slots array with items distributed.
 */
export function placeItemsInSlots(
  slots: TimeSlot[],
  items: ScheduleItem[]
): TimeSlot[] {
  const placed = slots.map((s) => ({ ...s, items: [] as ScheduleItem[] }));

  for (const item of items) {
    const itemTime = new Date(item.scheduledAt).getTime();
    for (const slot of placed) {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      if (itemTime >= slotStart && itemTime < slotEnd) {
        slot.items.push(item);
        break;
      }
    }
  }

  return placed;
}

/**
 * Build a schedule grid with items placed in slots.
 *
 * @param view Calendar view type.
 * @param periodStart ISO start datetime.
 * @param periodEnd ISO end datetime.
 * @param items Items to display.
 * @param slotMinutes Slot duration in minutes.
 * @returns Populated schedule grid.
 */
export function buildScheduleGrid(
  view: SchedulingView,
  periodStart: string,
  periodEnd: string,
  items: ScheduleItem[] = [],
  slotMinutes: number = DEFAULT_SLOT_MINUTES
): ScheduleGrid {
  const slots = generateSlots(periodStart, periodEnd, slotMinutes);
  const placed = placeItemsInSlots(slots, items);

  return {
    view,
    periodStart,
    periodEnd,
    slots: placed,
  };
}

/**
 * Group items by calendar day.
 *
 * @param items Schedule items.
 * @returns Map of YYYY-MM-DD to items.
 */
export function groupByDay(items: ScheduleItem[]): Map<string, ScheduleItem[]> {
  const map = new Map<string, ScheduleItem[]>();

  for (const item of items) {
    const day = item.scheduledAt.slice(0, 10); // YYYY-MM-DD
    const existing = map.get(day) || [];
    existing.push(item);
    map.set(day, existing);
  }

  return map;
}

/**
 * Find the next available send slot (first empty slot in the future).
 *
 * @param grid Schedule grid.
 * @returns ISO datetime of next available slot, or null if none.
 */
export function findNextAvailableSlot(grid: ScheduleGrid): string | null {
  const now = new Date();
  for (const slot of grid.slots) {
    if (new Date(slot.end) <= now) continue;
    if (slot.items.length === 0) return slot.start;
  }
  return null;
}

/**
 * Check if a given datetime falls within business hours (9-17, Mon-Fri).
 *
 * @param isoDate ISO datetime string.
 * @returns True if within business hours.
 */
export function isBusinessHours(isoDate: string): boolean {
  const d = new Date(isoDate);
  const hour = d.getHours();
  const day = d.getDay(); // 0=Sun, 6=Sat
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

/**
 * Suggest a better send time if current time is outside business hours.
 *
 * Moves to next business-day 09:00 if needed.
 *
 * @param isoDate Proposed send time.
 * @returns ISO datetime adjusted to business hours.
 */
export function suggestBusinessHourSlot(isoDate: string): string {
  const d = new Date(isoDate);
  const hour = d.getHours();
  const day = d.getDay();

  // If weekend, move to Monday
  if (day === 0) {
    d.setDate(d.getDate() + 1);
  } else if (day === 6) {
    d.setDate(d.getDate() + 2);
  }

  // If before 9am, move to 9am
  if (hour < 9) {
    d.setHours(9, 0, 0, 0);
  }
  // If after 5pm, move to next day 9am
  else if (hour >= 17) {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    // Handle rolling into weekend
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    else if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  }

  return d.toISOString();
}
