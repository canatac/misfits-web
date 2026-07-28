"use client";

/**
 * Snooze Picker — popover with preset times, custom date/time, and a list
 * of currently snoozed emails with an un-snooze action.
 */
import * as React from "react";
import { Clock, CalendarClock, X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  useSnoozeStore,
  SNOOZE_PRESETS,
  formatSnoozeUntil,
} from "@/stores/snooze-store";
import { useEmailStore } from "@/stores/email-store";
import type { SnoozedEmail } from "@/types/label";

interface SnoozePickerProps {
  emailId?: string;
  /** Trigger label. Defaults to "Snooze". */
  triggerLabel?: string;
  className?: string;
  align?: "start" | "center" | "end";
}

export function SnoozePicker({
  emailId,
  triggerLabel = "Snooze",
  className,
  align = "start",
}: SnoozePickerProps) {
  const snoozeEmail = useSnoozeStore((s) => s.snoozeEmail);
  const unsnoozeEmail = useSnoozeStore((s) => s.unsnoozeEmail);
  const snoozedEmails = useSnoozeStore((s) => s.snoozedEmails);
  const emails = useEmailStore((s) => s.emails);

  const [open, setOpen] = React.useState(false);
  const [showCustom, setShowCustom] = React.useState(false);
  const [customDate, setCustomDate] = React.useState("");
  const [customTime, setCustomTime] = React.useState("");
  const [reminder, setReminder] = React.useState("");
  const [enableReminder, setEnableReminder] = React.useState(true);

  function handlePreset(getUntil: () => string) {
    if (!emailId) return;
    snoozeEmail(emailId, getUntil(), enableReminder ? reminder || undefined : undefined);
    setOpen(false);
    setReminder("");
  }

  function handleCustomSnooze() {
    if (!emailId || !customDate) return;
    const iso = new Date(`${customDate}T${customTime || "09:00"}`).toISOString();
    if (Number.isNaN(new Date(iso).getTime())) return;
    snoozeEmail(emailId, iso, enableReminder ? reminder || undefined : undefined);
    setShowCustom(false);
    setCustomDate("");
    setCustomTime("");
    setReminder("");
    setOpen(false);
  }

  // Show snoozed list (used when no specific emailId is provided — manager mode).
  const managerMode = !emailId;
  const activeSnoozes = managerMode ? snoozedEmails : snoozedEmails.filter((s) => s.emailId === emailId);

  function emailSubject(id: string): string {
    const em = emails.find((e) => e.id === id);
    return em ? em.subject : id;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-1.5", className)} aria-label="Snooze">
          <Clock className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--color-muted-fg)]" />
          <span className="text-sm font-medium">Snooze until</span>
        </div>

        <Separator className="my-3" />

        {/* Presets */}
        <div className="flex flex-col gap-1">
          {SNOOZE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset.getUntil)}
              disabled={!emailId}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-50"
            >
              <CalendarClock className="h-4 w-4 text-[var(--color-muted-fg)]" />
              <span className="flex-1">{preset.label}</span>
              <span className="text-xs text-[var(--color-muted-fg)]">
                {formatSnoozeUntil(preset.getUntil())}
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            disabled={!emailId}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm text-[var(--color-brand-500)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-50"
          >
            <CalendarClock className="h-4 w-4" />
            <span className="flex-1">{showCustom ? "Hide custom date" : "Pick a date & time…"}</span>
          </button>
        </div>

        {/* Custom date/time */}
        {showCustom && emailId && (
          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <label className="text-xs text-[var(--color-muted-fg)]">Date</label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-[var(--color-muted-fg)]">Time</label>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Switch checked={enableReminder} onCheckedChange={setEnableReminder} aria-label="Enable reminder" />
              <Input
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                placeholder="Reminder note (optional)"
                disabled={!enableReminder}
              />
            </div>
            <Button size="sm" className="mt-2 w-full" onClick={handleCustomSnooze} disabled={!customDate}>
              Snooze
            </Button>
          </div>
        )}

        {/* Snoozed list (manager mode) */}
        {managerMode && activeSnoozes.length > 0 && (
          <>
            <Separator className="my-3" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-fg)]">
              Snoozed ({activeSnoozes.length})
            </span>
            <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-auto">
              {activeSnoozes.map((s) => (
                <SnoozedRow
                  key={s.emailId}
                  snooze={s}
                  subject={emailSubject(s.emailId)}
                  onUnsnooze={() => unsnoozeEmail(s.emailId)}
                />
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SnoozedRow({
  snooze,
  subject,
  onUnsnooze,
}: {
  snooze: SnoozedEmail;
  subject: string;
  onUnsnooze: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--color-muted)]">
      <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium">{subject}</span>
        <span className="text-[10px] text-[var(--color-muted-fg)]">
          {formatSnoozeUntil(snooze.snoozedUntil)}
        </span>
      </div>
      <button
        type="button"
        aria-label="Un-snooze"
        onClick={onUnsnooze}
        className="rounded p-1 text-[var(--color-muted-fg)] hover:bg-[var(--color-card)] hover:text-[var(--color-danger-500)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
