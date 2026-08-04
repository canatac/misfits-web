"use client";

/**
 * Calendar page (Issue #153).
 *
 * Main layout: header with view switcher + navigation, mini-calendar
 * sidebar, and the main calendar grid. Uses the Zustand calendar store
 * wired to the backend CRUD API.
 */
import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/stores/calendar-store";
import { useCalendarEvents, useCalendarMutations } from "@/hooks/use-calendar";
import type { CalendarView, CalendarEventInput } from "@/types/calendar";
import { CalendarGrid } from "./calendar-grid";
import { EventModal } from "./event-modal";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

function formatDateHeader(date: string, view: CalendarView): string {
  const d = new Date(date);
  const opts: Intl.DateTimeFormatOptions =
    view === "month"
      ? { month: "long", year: "numeric" }
      : view === "week"
        ? { month: "short", day: "numeric", year: "numeric" }
        : { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  return d.toLocaleDateString("en-US", opts);
}

export function CalendarPage() {
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const setSelectedDate = useCalendarStore((s) => s.setSelectedDate);
  const events = useCalendarStore((s) => s.events);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Compute the visible date range for the current view
  const { rangeStart, rangeEnd } = useMemo(() => {
    const d = new Date(selectedDate);
    if (view === "month") {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    if (view === "week") {
      const day = d.getDay();
      const start = new Date(d);
      start.setDate(d.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    // day
    const start = new Date(d);
    start.setHours(0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59);
    return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }, [selectedDate, view]);

  const { isLoading } = useCalendarEvents({
    start: rangeStart,
    end: rangeEnd,
  });

  function navigate(direction: -1 | 1) {
    const d = new Date(selectedDate);
    if (view === "month") {
      d.setMonth(d.getMonth() + direction);
    } else if (view === "week") {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setDate(d.getDate() + direction);
    }
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  function handleToday() {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-[var(--color-bg)]"
      data-testid="calendar-page"
    >
      {/* Main calendar area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-[var(--color-fg)]">
              {formatDateHeader(selectedDate, view)}
            </h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center rounded-lg border border-[var(--color-border)] p-0.5">
              {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    view === v
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                      : "text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]",
                  )}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>

            <Button onClick={() => { setEditingId(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <CalendarGrid
          view={view}
          selectedDate={selectedDate}
          events={events}
          isLoading={isLoading}
          onEventClick={(id) => { setEditingId(id); setModalOpen(true); }}
          onDayClick={(date) => { setSelectedDate(date); setView("day"); }}
        />
      </div>

      {/* Event modal */}
      <EventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        eventId={editingId}
        defaultDate={selectedDate}
      />
    </div>
  );
}
