"use client";

/**
 * Thread list item — collapsible thread row for the email list.
 *
 * Shows: participants, subject, message count, unread count, last message date.
 * Collapsed: shows last message preview.
 * Expanded: shows all messages as sub-rows.
 * Hover quick actions: reply, archive, delete.
 */
import { memo, useState } from "react";
import {
  ChevronRight,
  Reply,
  Archive,
  Trash2,
  Paperclip,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Thread } from "@/types/thread";
import type { Email } from "@/types/email";
import { formatDate, getInitials } from "./thread-list-item-utils";

interface ThreadListItemProps {
  thread: Thread;
  isActive: boolean;
  isExpanded: boolean;
  selectedEmailId: string | null;
  onSelectThread: (threadId: string) => void;
  onSelectEmail: (id: string) => void;
  onToggleExpand: (threadId: string) => void;
  onReply: (thread: Thread) => void;
  onArchive: (emailId: string) => void;
  onDelete: (emailId: string) => void;
}

function ThreadListItemComponent({
  thread,
  isActive,
  isExpanded,
  selectedEmailId,
  onSelectThread,
  onSelectEmail,
  onToggleExpand,
  onReply,
  onArchive,
  onDelete,
}: ThreadListItemProps) {
  const [hovered, setHovered] = useState(false);
  const lastMessage = thread.messages[thread.messages.length - 1];
  const hasUnread = thread.unreadCount > 0;
  const participantNames = thread.participants
    .filter((p) => p.address !== "hermes@misfits.ai")
    .slice(0, 3)
    .map((p) => p.name)
    .join(", ");
  const extraParticipants = thread.participants.length - 3;

  return (
    <div
      className={cn(
        "group relative border-b border-[var(--color-border)] transition-colors",
        isActive && "bg-[var(--color-accent)]",
        !isActive && hasUnread && "bg-[var(--color-card)]",
        !isActive && !hasUnread && "bg-[var(--color-bg)]",
        !isActive && "hover:bg-[var(--color-muted)]"
      )}
      data-testid={`thread-item-${thread.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main thread row */}
      <div
        className="flex cursor-pointer items-start gap-2 px-3 py-3"
        onClick={() => onSelectThread(thread.id)}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(thread.id);
          }}
          className="mt-1 shrink-0 rounded p-0.5 transition-colors hover:bg-[var(--color-muted)]"
          aria-label={isExpanded ? "Collapse thread" : "Expand thread"}
          aria-expanded={isExpanded}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-[var(--color-muted-fg)] transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Unread indicator */}
        {hasUnread && (
          <div
            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-500)]"
            aria-label="Unread messages"
          />
        )}

        {/* Avatar */}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(lastMessage.from.name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                hasUnread
                  ? "font-semibold text-[var(--color-fg)]"
                  : "text-[var(--color-fg)]"
              )}
            >
              {participantNames || lastMessage.from.name}
              {extraParticipants > 0 && (
                <span className="text-[var(--color-muted-fg)]">
                  {" "}
                  +{extraParticipants}
                </span>
              )}
            </span>
            <span className="shrink-0 text-xs text-[var(--color-muted-fg)]">
              {formatDate(thread.lastMessageDate)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                hasUnread
                  ? "font-medium text-[var(--color-fg)]"
                  : "text-[var(--color-muted-fg)]"
              )}
            >
              {thread.subject}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              {thread.hasAttachments && (
                <Paperclip
                  className="h-3.5 w-3.5 text-[var(--color-muted-fg)]"
                  aria-label="Has attachments"
                />
              )}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  hasUnread
                    ? "bg-[var(--color-brand-500)] text-white"
                    : "bg-[var(--color-muted)] text-[var(--color-muted-fg)]"
                )}
              >
                {thread.messageCount}
              </span>
            </div>
          </div>

          {!isExpanded && (
            <p className="truncate text-xs text-[var(--color-muted-fg)]">
              {lastMessage.preview}
            </p>
          )}

          {/* Unread count badge */}
          {hasUnread && !isExpanded && (
            <span className="text-[10px] font-medium text-[var(--color-brand-500)]">
              {thread.unreadCount} unread
            </span>
          )}
        </div>

        {/* Hover quick actions */}
        {hovered && (
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onReply(thread);
              }}
              aria-label="Reply to thread"
            >
              <Reply className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(lastMessage.id);
              }}
              aria-label="Archive thread"
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lastMessage.id);
              }}
              aria-label="Delete thread"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Expanded: show all messages */}
      {isExpanded && (
        <div className="ml-9 border-l border-[var(--color-border)] pl-2">
          {thread.messages.map((email: Email) => (
            <div
              key={email.id}
              role="option"
              aria-selected={email.id === selectedEmailId}
              tabIndex={0}
              onClick={() => onSelectEmail(email.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSelectEmail(email.id);
                }
              }}
              className={cn(
                "flex cursor-pointer items-start gap-2 border-b border-[var(--color-border)] px-3 py-2 transition-colors last:border-b-0",
                email.id === selectedEmailId && "bg-[var(--color-accent)]",
                email.id !== selectedEmailId &&
                  !email.isRead &&
                  "bg-[var(--color-card)]",
                email.id !== selectedEmailId &&
                  email.isRead &&
                  "bg-transparent",
                "hover:bg-[var(--color-muted)]"
              )}
              data-testid={`thread-msg-${email.id}`}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {getInitials(email.from.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-xs",
                      !email.isRead
                        ? "font-semibold text-[var(--color-fg)]"
                        : "text-[var(--color-fg)]"
                    )}
                  >
                    {email.from.name}
                  </span>
                  <span className="shrink-0 text-[10px] text-[var(--color-muted-fg)]">
                    {formatDate(email.date)}
                  </span>
                </div>
                <p className="truncate text-xs text-[var(--color-muted-fg)]">
                  {email.preview}
                </p>
              </div>
              {!email.isRead && (
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand-500)]" />
              )}
              {email.isStarred && (
                <Star className="h-3 w-3 shrink-0 fill-[var(--color-warning-500)] text-[var(--color-warning-500)]" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const ThreadListItem = memo(ThreadListItemComponent);
