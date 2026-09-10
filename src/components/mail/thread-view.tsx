"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Paperclip, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { groupEmailsIntoThreads, getLatestMessage, isThreadUnread } from "@/lib/thread-grouper";
import { useEmailStore } from "@/stores/email-store";
import { useLabelStore } from "@/stores/label-store";
import { LabelBadge } from "@/components/mail/label-badge";
import { formatDate } from "@/components/mail/email-list-item";
import { getInitials } from "@/components/mail/email-view-utils";
import type { Thread } from "@/types/thread";

interface ThreadListItemProps {
  thread: Thread;
  isSelected: boolean;
  onSelectThread: (id: string) => void;
  onSelectEmail: (id: string) => void;
  onToggleStar: (id: string) => void;
}

function ThreadListItem({
  thread,
  isSelected,
  onSelectThread,
  onSelectEmail,
  onToggleStar,
}: ThreadListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const latestMessage = getLatestMessage(thread);
  const unread = isThreadUnread(thread);

  return (
    <div
      className={cn(
        "border-b border-[var(--color-border)]",
        isSelected && "bg-[#1E1A15]"
      )}
      data-testid={`thread-${thread.id}`}
    >
      {/* Thread header */}
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--color-muted)]",
          unread && "bg-[var(--color-card)]"
        )}
        onClick={() => onSelectThread(thread.id)}
      >
        {/* Expand/collapse */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          aria-label={expanded ? "Collapse thread" : "Expand thread"}
          data-testid="thread-expand"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-500)]/20 text-xs font-medium text-[var(--color-brand-500)]">
          {getInitials(latestMessage.from.name)}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                unread ? "font-semibold text-[var(--color-fg)]" : "text-[var(--color-fg)]"
              )}
            >
              {latestMessage.from.name}
            </span>
            <span className="shrink-0 text-xs text-[var(--color-muted-fg)]">
              {formatDate(latestMessage.date)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                unread ? "font-medium text-[var(--color-fg)]" : "text-[var(--color-muted-fg)]"
              )}
            >
              {thread.subject}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {thread.hasAttachments && (
                <Paperclip className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(latestMessage.id);
                }}
                className="rounded p-0.5 hover:bg-[var(--color-muted)]"
                aria-label={latestMessage.isStarred ? "Unstar" : "Star"}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5",
                    latestMessage.isStarred
                      ? "fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
                      : "text-[var(--color-muted-fg)]"
                  )}
                />
              </button>
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium",
                  unread
                    ? "bg-[var(--color-brand-500)] text-white"
                    : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                )}
                data-testid="thread-message-count"
              >
                {thread.messageCount}
              </span>
            </div>
          </div>

          <p className="truncate text-xs text-[var(--color-muted-fg)]">
            {latestMessage.preview}
          </p>

          {/* Labels */}
          {thread.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {thread.labels.slice(0, 3).map((labelId) => (
                <LabelBadge key={labelId} label={labelId} />
              ))}
              {thread.labels.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-fg)]">
                  +{thread.labels.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded messages */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] pl-12">
          {thread.messages.map((email) => (
            <div
              key={email.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 transition-colors hover:bg-[var(--color-muted)]",
                !email.isRead && "bg-[var(--color-card)]"
              )}
              onClick={() => onSelectEmail(email.id)}
            >
              <div className="h-6 w-6 shrink-0 rounded-full bg-[var(--color-muted)]" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-xs", !email.isRead ? "font-semibold" : "")}>
                    {email.from.name}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted-fg)]">
                    {formatDate(email.date)}
                  </span>
                </div>
                <p className="truncate text-xs text-[var(--color-muted-fg)]">{email.preview}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadView() {
  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const toggleStar = useEmailStore((s) => s.toggleStar);

  const threadGroup = useMemo(() => groupEmailsIntoThreads(emails), [emails]);

  const handleSelectThread = (threadId: string) => {
    const thread = threadGroup.threads.find((t) => t.id === threadId);
    if (thread) {
      const latest = getLatestMessage(thread);
      selectEmail(latest.id);
    }
  };

  return (
    <div className="flex h-full flex-col" data-testid="thread-view">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#242427] bg-[#121214] px-3 py-2">
        <span className="text-sm font-medium text-[#C49B66]">
          {threadGroup.totalCount} conversation{threadGroup.totalCount !== 1 ? "s" : ""}
          {threadGroup.unreadCount > 0 && ` (${threadGroup.unreadCount} unread)`}
        </span>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {threadGroup.threads.map((thread) => (
          <ThreadListItem
            key={thread.id}
            thread={thread}
            isSelected={thread.messages.some((m) => m.id === selectedEmailId)}
            onSelectThread={handleSelectThread}
            onSelectEmail={selectEmail}
            onToggleStar={toggleStar}
          />
        ))}
        {threadGroup.threads.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-fg)]">
            No conversations
          </div>
        )}
      </div>
    </div>
  );
}
