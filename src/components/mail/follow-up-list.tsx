"use client";

/**
 * Follow-up list — renders emails that need a follow-up (reply or promise).
 * Shows sender, subject, days waiting, urgency badge, and action buttons:
 * Reply, Snooze (tomorrow / 3 days / 1 week), Dismiss.
 * (Issue #151)
 */
import { useMemo } from "react";
import {
  Clock,
  Reply,
  Clock3,
  X,
  AlertTriangle,
  CircleDot,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useFollowUps,
  useDismissFollowUp,
  useSnoozeFollowUp,
} from "@/hooks/use-follow-ups";
import { useEmailStore } from "@/stores/email-store";
import { useComposerStore } from "@/stores/composer-store";
import { getUrgency } from "@/lib/follow-up-detector";
import type { FollowUpItem } from "@/types/follow-up";

function daysBetween(fromISO: string, toISO: string): number {
  return Math.max(
    0,
    Math.floor(
      (new Date(toISO).getTime() - new Date(fromISO).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function urgencyVariant(urgency: "info" | "warning" | "urgent") {
  switch (urgency) {
    case "urgent":
      return "destructive" as const;
    case "warning":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

function urgencyLabel(urgency: "info" | "warning" | "urgent") {
  switch (urgency) {
    case "urgent":
      return "Urgent";
    case "warning":
      return "Overdue";
    default:
      return "Due soon";
  }
}

function typeIcon(type: FollowUpItem["type"]) {
  return type === "promise" ? AlertTriangle : CircleDot;
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

  const snoozeOptions = useMemo(
    () => [
      {
        label: "Tomorrow",
        getISO: () => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(9, 0, 0, 0);
          return d.toISOString();
        },
      },
      {
        label: "In 3 days",
        getISO: () => {
          const d = new Date();
          d.setDate(d.getDate() + 3);
          d.setHours(9, 0, 0, 0);
          return d.toISOString();
        },
      },
      {
        label: "In 1 week",
        getISO: () => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          d.setHours(9, 0, 0, 0);
          return d.toISOString();
        },
      },
    ],
    []
  );

  const handleReply = (fu: FollowUpItem) => {
    // Navigate to the email, then open composer.
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
          const UrgencyIcon = typeIcon(fu.type);
          return (
            <div key={fu.id}>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-muted)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <UrgencyIcon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          urgency === "urgent"
                            ? "text-[var(--color-danger-500)]"
                            : urgency === "warning"
                              ? "text-[var(--color-warning-500)]"
                              : "text-[var(--color-muted-fg)]"
                        )}
                      />
                      <span className="truncate text-sm font-medium">
                        {fu.senderName}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--color-muted-fg)]">
                      {fu.subject}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={urgencyVariant(urgency)}>
                        {urgencyLabel(urgency)}
                      </Badge>
                      <span className="text-xs text-[var(--color-muted-fg)]">
                        {daysWaiting} day{daysWaiting === 1 ? "" : "s"} waiting
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
                      {fu.type === "promise" ? "Promise" : "Needs reply"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5"
                    onClick={() => handleReply(fu)}
                    data-testid={`followup-reply-${fu.id}`}
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Reply
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        data-testid={`followup-snooze-${fu.id}`}
                      >
                        <Clock3 className="h-3.5 w-3.5" />
                        Snooze
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Snooze for…</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {snoozeOptions.map((opt) => (
                        <DropdownMenuItem
                          key={opt.label}
                          onClick={() =>
                            snoozeMutation.mutate({
                              id: fu.id,
                              untilISO: opt.getISO(),
                            })
                          }
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto gap-1.5 text-[var(--color-muted-fg)]"
                    onClick={() => dismissMutation.mutate(fu.id)}
                    data-testid={`followup-dismiss-${fu.id}`}
                    aria-label="Dismiss follow-up"
                  >
                    <X className="h-3.5 w-3.5" />
                    Dismiss
                  </Button>
                </div>
              </div>
              <Separator className="my-0.5 opacity-0" />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
