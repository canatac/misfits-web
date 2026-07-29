"use client";

/**
 * Event modal (Issue #153).
 *
 * Create or edit a calendar event. Uses the calendar store mutations
 * to POST/PUT/DELETE on the backend API.
 */
import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/stores/calendar-store";
import { useCalendarMutations } from "@/hooks/use-calendar";
import { EVENT_TYPE_COLORS, type EventType, type CalendarEventInput } from "@/types/calendar";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  defaultDate: string;
}

const EVENT_TYPES: EventType[] = ["meeting", "deadline", "reminder", "social", "travel", "default"];

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function EventModal({ open, onOpenChange, eventId, defaultDate }: EventModalProps) {
  const event = useCalendarStore((s) => (eventId ? s.getEventById(eventId) : undefined));
  const { createEvent, updateEvent, deleteEvent } = useCalendarMutations();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(toLocalInput(defaultDate));
  const [end, setEnd] = useState(toLocalInput(defaultDate));
  const [eventType, setEventType] = useState<EventType>("default");
  const [color, setColor] = useState("#3788d8");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setStart(toLocalInput(event.start));
      setEnd(toLocalInput(event.end));
      setEventType(event.eventType);
      setColor(event.color);
      setLocation(event.location);
    } else {
      setTitle("");
      setDescription("");
      setStart(toLocalInput(defaultDate));
      setEnd(toLocalInput(defaultDate));
      setEventType("default");
      setColor("#3788d8");
      setLocation("");
    }
  }, [event, defaultDate, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: CalendarEventInput = {
      title,
      description: description || undefined,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      eventType,
      color,
      location: location || undefined,
    };
    try {
      if (eventId) {
        await updateEvent.mutateAsync({ id: eventId, update: input });
      } else {
        await createEvent.mutateAsync(input);
      }
      onOpenChange(false);
    } catch {
      // Error handled by store
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    try {
      await deleteEvent.mutateAsync(eventId);
      onOpenChange(false);
    } catch {
      // Error handled by store
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div
        className="w-full max-w-md rounded-lg bg-[var(--color-card)] p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-fg)]">
            {eventId ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={() => onOpenChange(false)} className="text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)]"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)]"
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--color-muted-fg)]">Start</span>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--color-muted-fg)]">End</span>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)]"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-muted-fg)]">Type</span>
            <select
              value={eventType}
              onChange={(e) => {
                const t = e.target.value as EventType;
                setEventType(t);
                setColor(EVENT_TYPE_COLORS[t]);
              }}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)]"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--color-muted-fg)]">Location (optional)</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)]"
            />
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted-fg)]">Color</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-[var(--color-border)]"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {eventId ? (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title}>
                {eventId ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
