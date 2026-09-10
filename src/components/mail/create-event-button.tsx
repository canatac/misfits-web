"use client";

import { useState, useCallback } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  extractEventFromEmail,
  extractedEventToInput,
} from "@/lib/email-to-event";
import { useCalendarStore } from "@/stores/calendar-store";
import type { Email } from "@/types/email";

interface CreateEventButtonProps {
  email: Email;
  /** Optional callback after event is created */
  onEventCreated?: (eventId: string) => void;
}

/**
 * CreateEventButton — creates a calendar event from an email.
 *
 * Extracts event data (date, time, location) from email content
 * and creates a linked calendar event.
 */
export function CreateEventButton({ email, onEventCreated }: CreateEventButtonProps) {
  const [creating, setCreating] = useState(false);
  const createEvent = useCalendarStore((s) => s.createEvent);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const extracted = extractEventFromEmail(email);
      if (!extracted) {
        // Could not extract event data — silently fail or show notification
        return;
      }
      const input = extractedEventToInput(extracted);
      const event = await createEvent(input);
      onEventCreated?.(event.id);
    } finally {
      setCreating(false);
    }
  }, [email, createEvent, onEventCreated]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={handleCreate}
      disabled={creating}
      aria-label="Create event from email"
      data-testid="create-event-button"
    >
      <CalendarPlus className="h-4 w-4" />
      {creating ? "Creating..." : "Create Event"}
    </Button>
  );
}
