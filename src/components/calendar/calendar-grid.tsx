"use client";

/**
 * Calendar grid (Issue #153).
 * Cycle 56: extracted views + helpers to ./calendar-grid-parts.tsx.
 */
import type { CalendarView, CalendarEvent } from "@/types/calendar";
import { DayView, WeekView, MonthView } from "./calendar-grid-parts";

interface CalendarGridProps {
  view: CalendarView;
  selectedDate: string;
  events: CalendarEvent[];
  isLoading: boolean;
  onEventClick: (id: string) => void;
  onDayClick: (date: string) => void;
}

export function CalendarGrid({
  view,
  selectedDate,
  events,
  isLoading,
  onEventClick,
  onDayClick,
}: CalendarGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--color-muted-fg)]">
        Loading events...
      </div>
    );
  }

  if (view === "day")
    return (
      <DayView events={events} selectedDate={selectedDate} onEventClick={onEventClick} />
    );
  if (view === "week")
    return (
      <WeekView events={events} selectedDate={selectedDate} onEventClick={onEventClick} />
    );
  return (
    <MonthView
      events={events}
      selectedDate={selectedDate}
      onEventClick={onEventClick}
      onDayClick={onDayClick}
    />
  );
}
