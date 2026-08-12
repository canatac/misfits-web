"use client";

/**
 * Reminder banner — a fixed-position toast/banner that surfaces overdue
 * follow-up reminders. Shows messages like "You haven't replied to Marc in
 * 3 days" or "You promised to send the report today".
 *
 * Renders a dismissible card per active reminder, stacked at the bottom-right.
 * Uses the follow-up store + reminder dismissal mutation. (Issue #151)
 */
import { useEffect, useState } from "react";
import { Bell, X, AlertTriangle, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFollowUps, useDismissReminder } from "@/hooks/use-follow-ups";
import type { FollowUpReminder } from "@/types/follow-up";

function urgencyStyles(urgency: FollowUpReminder["urgency"]) {
  switch (urgency) {
    case "urgent":
      return {
        border: "border-[var(--color-danger-500)]",
        bg: "bg-[var(--color-danger-500)]",
        text: "text-white",
        Icon: AlertTriangle,
      };
    case "warning":
      return {
        border: "border-[var(--color-warning-500)]",
        bg: "bg-[var(--color-warning-500)]",
        text: "text-white",
        Icon: Bell,
      };
    default:
      return {
        border: "border-[var(--color-brand-500)]",
        bg: "bg-[var(--color-brand-500)]",
        text: "text-white",
        Icon: Info,
      };
  }
}

export function ReminderBanner() {
  const { reminders } = useFollowUps();
  const dismissMutation = useDismissReminder();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Reset dismissed set when a new scan produces new reminders.
  useEffect(() => {
    const currentIds = new Set(reminders.map((r) => r.followUpId));
    setDismissedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (currentIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [reminders]);

  const visible = reminders.filter((r) => !dismissedIds.has(r.followUpId));
  if (visible.length === 0) return null;

  return (
    <div
      className="fixed right-4 bottom-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-label="Follow-up reminders"
      data-testid="reminder-banner"
    >
      {visible.slice(0, 4).map((reminder) => {
        const styles = urgencyStyles(reminder.urgency);
        const Icon = styles.Icon;
        return (
          <div
            key={reminder.id}
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius-lg)] border p-3 shadow-lg",
              styles.border,
              "bg-[var(--color-card)]"
            )}
            role="alert"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                styles.bg,
                styles.text
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-fg)]">
                {reminder.message}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-muted-fg)]">
                {reminder.subject}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted-fg)]">
                <Clock className="h-3 w-3" />
                {reminder.daysWaiting} day
                {reminder.daysWaiting === 1 ? "" : "s"} waiting
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-[var(--color-muted-fg)]"
              onClick={() => {
                setDismissedIds((prev) =>
                  new Set(prev).add(reminder.followUpId)
                );
                dismissMutation.mutate(reminder.followUpId);
              }}
              aria-label="Dismiss reminder"
              data-testid={`reminder-dismiss-${reminder.followUpId}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
