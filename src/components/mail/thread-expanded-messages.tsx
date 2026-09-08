"use client";

/**
 * Thread expanded messages — sub-rows shown when a thread is expanded.
 * Extracted from thread-list-item.tsx (cycle 54 LOC reduction).
 */
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Email } from "@/types/email";
import { formatDate, getInitials } from "./thread-list-item-utils";

const INITIAL_VISIBLE_MESSAGES = 2;
const BATCH_SIZE = 4;
const THREAD_LARGE_THRESHOLD = 8;
const BATCH_DELAY_MS = 120;

interface ThreadExpandedMessagesProps {
  messages: Email[];
  selectedEmailId: string | null;
  onSelectEmail: (id: string) => void;
}

export function ThreadExpandedMessages({
  messages,
  selectedEmailId,
  onSelectEmail,
}: ThreadExpandedMessagesProps) {
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_VISIBLE_MESSAGES, messages.length)
  );

  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE_MESSAGES, messages.length));
  }, [messages]);

  const hasPendingMessages = visibleCount < messages.length;
  const remainingCount = Math.max(messages.length - visibleCount, 0);

  useEffect(() => {
    if (!hasPendingMessages) return;

    const timer = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + BATCH_SIZE, messages.length));
    }, BATCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [hasPendingMessages, messages.length, visibleCount]);

  const visibleMessages = messages.slice(0, visibleCount);

  return (
    <div className="ml-9 border-l border-[var(--color-border)] pl-2">
      {visibleMessages.map((email: Email) => (
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

      {hasPendingMessages && (
        <div className="space-y-1 border-b border-[var(--color-border)] px-3 py-2">
          {Array.from({ length: Math.min(remainingCount, BATCH_SIZE) }).map((_, index) => (
            <div key={`thread-skeleton-${index}`} className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="h-2.5 w-44" />
              </div>
            </div>
          ))}
          {messages.length > THREAD_LARGE_THRESHOLD && (
            <button
              type="button"
              onClick={() => setVisibleCount(messages.length)}
              className="text-xs text-[var(--color-brand-500)] hover:underline"
            >
              Voir tout ({messages.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
