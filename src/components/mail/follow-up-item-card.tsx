"use client";

import {
  Reply,
  Clock3,
  X,
  AlertTriangle,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { FollowUpItem } from "@/types/follow-up";

type Urgency = "info" | "warning" | "urgent";

function urgencyVariant(urgency: Urgency) {
  switch (urgency) {
    case "urgent":
      return "destructive" as const;
    case "warning":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

function urgencyLabel(urgency: Urgency) {
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

export interface SnoozeOption {
  label: string;
  getISO: () => string;
}

export function FollowUpItemCard({
  fu,
  urgency,
  daysWaiting,
  snoozeOptions,
  onReply,
  onSnooze,
  onDismiss,
}: {
  fu: FollowUpItem;
  urgency: Urgency;
  daysWaiting: number;
  snoozeOptions: SnoozeOption[];
  onReply: (fu: FollowUpItem) => void;
  onSnooze: (id: string, untilISO: string) => void;
  onDismiss: (id: string) => void;
}) {
  const UrgencyIcon = typeIcon(fu.type);
  return (
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
          onClick={() => onReply(fu)}
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
                onClick={() => onSnooze(fu.id, opt.getISO())}
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
          onClick={() => onDismiss(fu.id)}
          data-testid={`followup-dismiss-${fu.id}`}
          aria-label="Dismiss follow-up"
        >
          <X className="h-3.5 w-3.5" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
