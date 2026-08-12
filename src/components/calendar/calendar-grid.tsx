"use client";

/**
 * Calendar grid (Issue #153).
 *
 * Renders the day / week / month views. Events are positioned absolutely
 * within time slots for day/week, and as chips inside day cells for month.
 */
import { cn } from "@/lib/utils";
import type { CalendarView, CalendarEvent } from "@/types/calendar";

interface CalendarGridProps {
  view: CalendarView;
  selectedDate: string;
  events: CalendarEvent[];
  isLoading: boolean;
  onEventClick: (id: string) => void;
  onDayClick: (date: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_HEIGHT = 48; // px per hour

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekDays(date: string): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    return dt;
  });
}

function getMonthDays(date: string): Date[] {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const dt = new Date(gridStart);
    dt.setDate(gridStart.getDate() + i);
    return dt;
  });
}

function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => sameDay(new Date(e.start), day));
}

/** Position an event within a day/week time column. */
function eventStyle(e: CalendarEvent): { top: number; height: number } {
  const start = new Date(e.start);
  const end = new Date(e.end);
  const topMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  const top = (topMin / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - topMin) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
}

function EventChip({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute right-1 left-1 truncate rounded px-1.5 py-0.5 text-left text-xs text-white"
      style={{
        backgroundColor: event.color,
        top: eventStyle(event).top,
        height: eventStyle(event).height,
      }}
    >
      {event.title}
    </button>
  );
}

function TimeColumn() {
  return (
    <div className="w-14 shrink-0 border-r border-[var(--color-border)]">
      {HOURS.map((h) => (
        <div
          key={h}
          className="pr-2 text-right text-xs text-[var(--color-muted-fg)]"
          style={{ height: HOUR_HEIGHT }}
        >
          {h === 0 ? "" : h <= 12 ? `${h} AM` : `${h - 12} PM`}
        </div>
      ))}
    </div>
  );
}

/* --- Day view --- */
function DayView({
  events,
  selectedDate,
  onEventClick,
}: Omit<CalendarGridProps, "view" | "isLoading" | "onDayClick">) {
  const day = new Date(selectedDate);
  const dayEvents = eventsForDay(events, day);
  return (
    <div className="flex flex-1 overflow-auto">
      <TimeColumn />
      <div className="relative flex-1">
        {HOURS.map((h) => (
          <div
            key={h}
            className="border-b border-[var(--color-border)]"
            style={{ height: HOUR_HEIGHT }}
          />
        ))}
        {dayEvents.map((e) => (
          <EventChip key={e.id} event={e} onClick={() => onEventClick(e.id)} />
        ))}
      </div>
    </div>
  );
}

/* --- Week view --- */
function WeekView({
  events,
  selectedDate,
  onEventClick,
}: Omit<CalendarGridProps, "view" | "isLoading" | "onDayClick">) {
  const days = getWeekDays(selectedDate);
  return (
    <div className="flex flex-1 overflow-auto">
      <TimeColumn />
      <div className="flex flex-1">
        {days.map((day) => {
          const dayEvents = eventsForDay(events, day);
          return (
            <div
              key={day.toISOString()}
              className="flex-1 border-r border-[var(--color-border)]"
            >
              <div className="border-b border-[var(--color-border)] py-1 text-center text-xs text-[var(--color-muted-fg)]">
                {WEEKDAYS[day.getDay()]} {day.getDate()}
              </div>
              <div className="relative">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b border-[var(--color-border)]"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {dayEvents.map((e) => (
                  <EventChip
                    key={e.id}
                    event={e}
                    onClick={() => onEventClick(e.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- Month view --- */
function MonthView({
  events,
  selectedDate,
  onEventClick,
  onDayClick,
}: Omit<CalendarGridProps, "view" | "isLoading">) {
  const days = getMonthDays(selectedDate);
  const currentMonth = new Date(selectedDate).getMonth();
  return (
    <div className="flex flex-1 flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-[var(--color-muted-fg)]"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const inMonth = day.getMonth() === currentMonth;
          const dayEvents = eventsForDay(events, day);
          const dateStr = day.toISOString().slice(0, 10);
          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={cn(
                "overflow-hidden border-r border-b border-[var(--color-border)] p-1 text-left align-top",
                inMonth
                  ? "bg-[var(--color-card)]"
                  : "bg-[var(--color-muted)] opacity-50"
              )}
            >
              <span className="text-xs text-[var(--color-muted-fg)]">
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onEventClick(e.id);
                    }}
                    className="truncate rounded px-1 py-0.5 text-xs text-white"
                    style={{ backgroundColor: e.color }}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-xs text-[var(--color-muted-fg)]">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
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
      <DayView
        events={events}
        selectedDate={selectedDate}
        onEventClick={onEventClick}
      />
    );
  if (view === "week")
    return (
      <WeekView
        events={events}
        selectedDate={selectedDate}
        onEventClick={onEventClick}
      />
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
