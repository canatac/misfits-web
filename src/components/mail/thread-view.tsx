"use client";

/**
 * Thread view — chronological display of all messages in a conversation.
 */
import { useMemo, useState, useCallback } from "react";
import { Reply, Forward, PanelTop, ChevronDown, ChevronUp } from "lucide-react";
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

export function ThreadView({ thread, viewMode, className }: ThreadViewProps) {
  const { forwardThread, replyToThread } = useThreadActions();
  // null = mixed state, true = all collapsed, false = all expanded
  const [forceCollapse, setForceCollapse] = useState<boolean | null>(null);

  const latestUnread = useMemo(() => {
    if (!thread) return null;
    for (let i = thread.messages.length - 1; i >= 0; i--) {
      if (!thread.messages[i].isRead) return thread.messages[i];
    }
    return null;
  }, [thread]);

  const handleToggleAll = useCallback(() => {
    setForceCollapse((prev) => {
      if (prev === false) return true;
      return false;
    });
  }, []);

  const handleMixedState = useCallback(() => {
    setForceCollapse(null);
  }, []);

  if (!thread) {
    return (
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--color-muted)]",
          unread && "bg-[var(--color-card)]"
        )}
        onClick={() => onSelectThread(thread.id)}
      >
        <EmptyState
          icon={PanelTop}
          title="No thread selected"
          description="Select a thread from the list to view its messages here."
          size="lg"
        />
      </div>
    );
  }

  const isAllExpanded = forceCollapse === false;

  return (
    <div
      className={cn("flex h-full flex-col bg-[var(--color-bg)]", className)}
      data-testid="thread-view"
    >
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => replyToThread(thread)} className="gap-1.5">
          <Reply className="h-4 w-4" />
          Reply
        </Button>
        <Button variant="ghost" size="sm" onClick={() => forwardThread(thread)} className="gap-1.5">
          <Forward className="h-4 w-4" />
          Forward thread
        </Button>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAll}
            className="gap-1.5"
            aria-label={isAllExpanded ? "Collapse all messages" : "Expand all messages"}
            data-testid="thread-toggle-all"
          >
            {isAllExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse all
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand all
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl p-4">
          <div className="flex flex-col gap-4">
            {thread.messages.map((email, idx) => (
              <div key={email.id}>
                {idx > 0 && <Separator className="mb-4" />}
                <ThreadMessageItem
                  email={email}
                  isHighlighted={latestUnread?.id === email.id && !email.isRead}
                  viewMode={viewMode}
                  defaultCollapsed={
                    idx < thread.messages.length - 1 && email.isRead
                  }
                  forceCollapsed={forceCollapse}
                  onMixedState={handleMixedState}
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

interface ThreadViewProps {
  /** Optional: display a specific thread instead of grouping all emails */
  thread?: Thread;
  /** Display mode for the thread */
  viewMode?: "list" | "timeline";
}

export function ThreadView({ thread: providedThread, viewMode = "list" }: ThreadViewProps) {
  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const toggleStar = useEmailStore((s) => s.toggleStar);

  // Use provided thread or group all emails
  const threadGroup = useMemo(() => {
    if (providedThread) {
      return {
        threads: [providedThread],
        totalCount: 1,
        unreadCount: providedThread.unreadCount,
      };
    }
    return groupEmailsIntoThreads(emails);
  }, [providedThread, emails]);

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
