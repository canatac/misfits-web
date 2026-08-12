/**
 * Zustand store for the integrated calendar (Issue #153).
 *
 * Owns the event list, current view mode, and selected date.
 * Uses apiClient to talk to the backend CRUD endpoints — no mock data,
 * the calendar is fully server-backed.
 */
import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarEventUpdate,
  CalendarQuery,
  CalendarListResponse,
  CalendarView,
  EventType,
} from "@/types/calendar";

interface CalendarState {
  events: CalendarEvent[];
  view: CalendarView;
  selectedDate: string; // ISO date (yyyy-mm-dd)
  loading: boolean;
  error: string | null;

  // Queries
  fetchEvents: (query?: CalendarQuery) => Promise<void>;
  getEventById: (id: string) => CalendarEvent | undefined;

  // Mutations
  createEvent: (input: CalendarEventInput) => Promise<CalendarEvent>;
  updateEvent: (
    id: string,
    update: CalendarEventUpdate
  ) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;

  // UI
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
}

/** Convert a value that might be a BSON DateTime to an ISO string. */
function toISO(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const d = v as { $date?: string | { $numberLong?: string } };
    if (d.$date) {
      if (typeof d.$date === "string") return d.$date;
      if (d.$date.$numberLong)
        return new Date(Number(d.$date.$numberLong)).toISOString();
    }
  }
  return new Date().toISOString();
}

/** Normalize a raw backend event to proper TS types. */
function normalizeEvent(raw: Record<string, unknown>): CalendarEvent {
  return {
    id: raw.id as string,
    userId: raw.userId as string,
    title: raw.title as string,
    description: (raw.description as string) ?? "",
    start: toISO(raw.start),
    end: toISO(raw.end),
    eventType: (raw.eventType as EventType) ?? "default",
    color: (raw.color as string) ?? "#3788d8",
    location: (raw.location as string) ?? "",
    createdAt: toISO(raw.createdAt),
    updatedAt: toISO(raw.updatedAt),
  };
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  view: "week",
  selectedDate: new Date().toISOString().slice(0, 10),
  loading: false,
  error: null,

  fetchEvents: async (query) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (query?.start) params.set("start", query.start);
      if (query?.end) params.set("end", query.end);
      const qs = params.toString();
      const path = qs ? `/calendar/events?${qs}` : "/calendar/events";
      const res = await apiClient.get<CalendarListResponse>(path);
      const events = (res.events as unknown as Record<string, unknown>[]).map(
        normalizeEvent
      );
      set({ events, loading: false });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  getEventById: (id) => get().events.find((e) => e.id === id),

  createEvent: async (input) => {
    const event = await apiClient.post<CalendarEvent>(
      "/calendar/events",
      input
    );
    set((s) => ({ events: [...s.events, event] }));
    return event;
  },

  updateEvent: async (id, update) => {
    const event = await apiClient.put<CalendarEvent>(
      `/calendar/events/${id}`,
      update
    );
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? event : e)),
    }));
    return event;
  },

  deleteEvent: async (id) => {
    await apiClient.delete(`/calendar/events/${id}`);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },

  setView: (view) => set({ view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
