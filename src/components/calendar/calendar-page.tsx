"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Sparkles, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/stores/calendar-store";
import { useCalendarEvents } from "@/hooks/use-calendar";
import type { CalendarView } from "@/types/calendar";
import { CalendarGrid } from "./calendar-grid";
import { EventModal } from "./event-modal";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

const SMART_TASKS = [
  "Répondre au contrat Q4",
  "Valider copy onboarding mail",
  "Revue sécurité du matin",
  "Synchroniser roadmap sprint",
];

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
  const [doneTasks, setDoneTasks] = useState<Record<number, boolean>>({});

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
    const start = new Date(d);
    start.setHours(0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59);
    return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }, [selectedDate, view]);

  const { isLoading } = useCalendarEvents({ start: rangeStart, end: rangeEnd });

  function navigate(direction: -1 | 1) {
    const d = new Date(selectedDate);
    if (view === "month") d.setMonth(d.getMonth() + direction);
    else if (view === "week") d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0A0A0B] text-[#E0E0E0]" data-testid="calendar-page">
      <aside className="hidden w-80 flex-col border-r border-[#242427] bg-[#121214] p-5 xl:flex">
        <div className="mb-4 flex items-center justify-between border-b border-[#242427] pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-[#242427] bg-[#1D1D20] p-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#C49B66]" />
            </div>
            <h2 className="text-sm font-bold text-white">Tâches prioritaires</h2>
          </div>
          <Sparkles className="h-4 w-4 text-[#C49B66]" />
        </div>

        <div className="space-y-2.5 overflow-y-auto pr-1">
          {SMART_TASKS.map((task, idx) => {
            const done = Boolean(doneTasks[idx]);
            return (
              <button
                key={task}
                type="button"
                onClick={() => setDoneTasks((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs",
                  done
                    ? "border-[#242427] bg-[#121214] text-[#71717A]"
                    : "border-[#242427] bg-[#161619] text-[#E0E0E0] hover:border-[#C49B66]/60",
                )}
              >
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle2 className="h-4 w-4 text-[#C49B66]" /> : <Circle className="h-4 w-4" />}
                  <span className={done ? "line-through" : ""}>{task}</span>
                </div>
                <GripVertical className="h-4 w-4 text-[#71717A]" />
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-4 mt-4 rounded-2xl border border-[#242427] bg-[#121214] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-white">Planning intelligent</h1>
              <div className="hidden rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-1 text-xs font-mono text-[#C49B66] lg:flex">
                Créneaux recommandés: Lun 10:00, Mar 14:00, Mer 11:30
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="border border-[#242427] bg-[#1D1D20] hover:bg-[#242427]">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="rounded-lg border border-[#242427] bg-[#1D1D20] p-0.5">
                {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      view === v ? "bg-[#C49B66] text-[#0A0A0B]" : "text-[#A1A1AA] hover:bg-[#242427] hover:text-white",
                    )}
                  >
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="border border-[#242427] bg-[#1D1D20] hover:bg-[#242427]">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => { setEditingId(null); setModalOpen(true); }} className="gap-1.5 bg-[#C49B66] text-[#0A0A0B] hover:bg-[#d5ad78]">
                <Plus className="h-4 w-4" />
                New Event
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#71717A]">{formatDateHeader(selectedDate, view)}</p>
        </div>

        <div className="m-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#242427] bg-[#121214] p-3">
          <CalendarGrid
            view={view}
            selectedDate={selectedDate}
            events={events}
            isLoading={isLoading}
            onEventClick={(id) => {
              setEditingId(id);
              setModalOpen(true);
            }}
            onDayClick={(date) => {
              setSelectedDate(date);
              setView("day");
            }}
          />
        </div>
      </div>

      <EventModal open={modalOpen} onOpenChange={setModalOpen} eventId={editingId} defaultDate={selectedDate} />
    </div>
  );
}
