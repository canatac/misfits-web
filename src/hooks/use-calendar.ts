/**
 * Calendar data hooks (Issue #153).
 *
 * Wrap the Zustand calendar store with TanStack Query for caching +
 * cache invalidation, following the same pattern as use-contacts.ts.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCalendarStore } from "@/stores/calendar-store";
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarEventUpdate,
  CalendarQuery,
} from "@/types/calendar";

/** Query all events in a date range. */
export function useCalendarEvents(query?: CalendarQuery) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["calendar", query],
    queryFn: async () => {
      await useCalendarStore.getState().fetchEvents(query);
      return useCalendarStore.getState().events;
    },
    staleTime: 30_000,
  });
}

/** Query a single event by id. */
export function useCalendarEvent(id: string | null) {
  return useQuery<CalendarEvent | undefined>({
    queryKey: ["calendar", id],
    queryFn: () =>
      id ? useCalendarStore.getState().getEventById(id) : undefined,
    enabled: !!id,
    staleTime: Infinity,
  });
}

/** Create / update / delete mutations. Invalidates the calendar cache. */
export function useCalendarMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["calendar"] });

  const createEvent = useMutation<CalendarEvent, Error, CalendarEventInput>({
    mutationFn: (input) => useCalendarStore.getState().createEvent(input),
    onSuccess: invalidate,
  });

  const updateEvent = useMutation<
    CalendarEvent,
    Error,
    { id: string; update: CalendarEventUpdate }
  >({
    mutationFn: ({ id, update }) =>
      useCalendarStore.getState().updateEvent(id, update),
    onSuccess: invalidate,
  });

  const deleteEvent = useMutation<void, Error, string>({
    mutationFn: (id) => useCalendarStore.getState().deleteEvent(id),
    onSuccess: invalidate,
  });

  return { createEvent, updateEvent, deleteEvent };
}
