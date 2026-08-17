"use client";

/**
 * Follow-up list — renders emails that need a follow-up (reply or promise).
 * (Issue #151)
 */
import { useMemo } from "react";
import { Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useFollowUps,
  useDismissFollowUp,
  useSnoozeFollowUp,
} from "@/hooks/use-follow-ups";
import { useEmailStore } from "@/stores/email-store";
import { useComposerStore } from "@/stores/composer-store";
import { getUrgency } from "@/lib/follow-up-detector";
import type { FollowUpItem } from "@/types/follow-up";
import {
  FollowUpItemCard,
  type SnoozeOption,
} from "./follow-up-item-card";

function daysBetween(fromISO: string, toISO: string): number {
  return Math.max(
    0,
    Math.floor(
      (new Date(toISO).getTime() - new Date(fromISO).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function makeSnoozeOptions(): SnoozeOption[] {
  const at9 = (days: number) => () => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  };
  return [
    { label: "Tomorrow", getISO: at9(1) },
    { label: "In 3 days", getISO: at9(3) },
    { label: "In 1 week", getISO: at9(7) },
  ];
}

export function FollowUpList({ className }: { className?: string }) {
  const { followUps, isScanning } = useFollowUps();
  const dismissMutation = useDismissFollowUp();
  const snoozeMutation = useSnoozeFollowUp();

  const selectEmail = useEmailStore((s) => s.selectEmail);
  const setFolder = useEmailStore((s) => s.setFolder);
  const emails = useEmailStore((s) => s.emails);
  const openComposer = useComposerStore((s) => s.openComposer);

  const now = useMemo(() => new Date(), []);
  const snoozeOptions = useMemo(makeSnoozeOptions, []);

  const handleReply = (fu: FollowUpItem) => {
    const email = emails.find((e) => e.id === fu.emailId);
    if (email) {
      setFolder(email.folder);
      selectEmail(email.id);
    }
    openComposer(
      email
        ? {
            to: [
              {
                id: `rcpt-${Date.now()}`,
                email: fu.senderAddress,
                name: fu.senderName,
                type: "to" as const,
              },
            ],
            subject: email.subject.startsWith("Re: ")
              ? email.subject
              : `Re: ${email.subject}`,
            body: "",
            inReplyTo: email.messageId,
          }
        : null
    );
  };

  if (isScanning) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-muted-fg)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Scanning for follow-ups…
      </div>
    );
  }

  if (followUps.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <Clock className="mx-auto mb-2 h-8 w-8 text-[var(--color-muted-fg)]" />
        <p className="text-sm font-medium">All caught up</p>
        <p className="text-xs text-[var(--color-muted-fg)]">
          No emails need a follow-up right now.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="flex flex-col gap-1 p-2">
        {followUps.map((fu) => {
          const urgency = getUrgency(fu, now);
          const daysWaiting = daysBetween(fu.emailDate, now.toISOString());
          return (
            <div key={fu.id}>
              <FollowUpItemCard
                fu={fu}
                urgency={urgency}
                daysWaiting={daysWaiting}
                snoozeOptions={snoozeOptions}
                onReply={handleReply}
                onSnooze={(id, untilISO) =>
                  snoozeMutation.mutate({ id, untilISO })
                }
                onDismiss={(id) => dismissMutation.mutate(id)}
              />
              <Separator className="my-0.5 opacity-0" />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
