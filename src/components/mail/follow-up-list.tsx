"use client";

/**
 * Follow-up list — renders emails that need a follow-up (reply or promise).
 * (Issue #151, extended by #1043: configurable reminder interval.)
 */
import { useMemo } from "react";
import { Clock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FollowUpItemCard } from "./follow-up-item-card";
import {
  useFollowUps,
  useDismissFollowUp,
  useSnoozeFollowUp,
  useReminderHours,
  REMINDER_INTERVALS_HOURS,
} from "@/hooks/use-follow-ups";
import { useEmailStore } from "@/stores/email-store";
import { useComposerStore } from "@/stores/composer-store";
import { getUrgency, daysBetween } from "@/lib/follow-up-utils";

export function FollowUpList({ className }: { className?: string }) {
  const { followUps, isScanning } = useFollowUps();
  const dismissMutation = useDismissFollowUp();
  const snoozeMutation = useSnoozeFollowUp();
  const { hours, setHours } = useReminderHours();

  const selectEmail = useEmailStore((s) => s.selectEmail);
  const setFolder = useEmailStore((s) => s.setFolder);
  const openComposer = useComposerStore((s) => s.openComposer);

  const now = useMemo(() => new Date(), []);

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="flex flex-col gap-1 p-2">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs font-medium text-[var(--color-muted-fg)]">
            Remind me after
          </span>
          <select
            className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-fg)]"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value) as typeof hours)}
            data-testid="followup-reminder-interval"
            aria-label="Follow-up reminder interval"
          >
            {REMINDER_INTERVALS_HOURS.map((h) => (
              <option key={h} value={h}>
                {h === 24 ? "24 hours" : h === 48 ? "48 hours" : "7 days"}
              </option>
            ))}
          </select>
        </div>
        {isScanning ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-muted-fg)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning your mailbox…
          </div>
        ) : followUps.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-[var(--color-muted-fg)]" />
            <p className="text-sm text-[var(--color-muted-fg)]">
              No follow-ups yet. Emails that need a reply will appear here.
            </p>
          </div>
        ) : (
          followUps.map((fu) => {
            const urgency = getUrgency(fu, now);
            const daysWaiting = daysBetween(fu.emailDate, now.toISOString());
            return (
              <FollowUpItemCard
                key={fu.id}
                followUp={fu}
                urgency={urgency}
                daysWaiting={daysWaiting}
                onOpen={() => {
                  selectEmail(fu.emailId);
                  setFolder("inbox");
                }}
                onReply={() => {
                  selectEmail(fu.emailId);
                  setFolder("inbox");
                  openComposer({ replyToEmailId: fu.emailId });
                }}
                onDismiss={() => dismissMutation.mutate(fu.id)}
                onSnooze={(untilISO) => snoozeMutation.mutate({ id: fu.id, untilISO })}
              />
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}
