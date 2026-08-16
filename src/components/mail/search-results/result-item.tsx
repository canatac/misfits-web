"use client";

import { Paperclip, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Email } from "@/types/email";
import type { MatchHighlight } from "@/types/search";
import {
  HighlightedText,
  fieldHighlights,
  formatDate,
  getInitials,
} from "./highlight-utils";

interface ResultItemProps {
  email: Email;
  highlights: MatchHighlight[];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ResultItem({
  email,
  highlights,
  isSelected,
  onSelect,
}: ResultItemProps) {
  const subjectHL = fieldHighlights(highlights, "subject");
  const fromHL = fieldHighlights(highlights, "from");
  const previewHL = fieldHighlights(highlights, "preview");

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(email.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSelect(email.id);
        }
      }}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 border-b border-[var(--color-border)] px-3 py-3 transition-colors",
        isSelected && "bg-[var(--color-accent)]",
        !isSelected && email.isRead && "bg-[var(--color-bg)]",
        !isSelected && !email.isRead && "bg-[var(--color-card)]",
        !isSelected && "hover:bg-[var(--color-muted)]"
      )}
      data-testid={`search-result-${email.id}`}
    >
      {!email.isRead && (
        <div
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-500)]"
          aria-label="Unread"
        />
      )}

      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(email.from.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              !email.isRead
                ? "font-semibold text-[var(--color-fg)]"
                : "text-[var(--color-fg)]"
            )}
          >
            <HighlightedText text={email.from.name} highlights={fromHL} />
          </span>
          <span className="shrink-0 text-xs text-[var(--color-muted-fg)]">
            {formatDate(email.date)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              !email.isRead
                ? "font-medium text-[var(--color-fg)]"
                : "text-[var(--color-muted-fg)]"
            )}
          >
            <HighlightedText text={email.subject} highlights={subjectHL} />
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {email.hasAttachments && (
              <Paperclip
                className="h-3.5 w-3.5 text-[var(--color-muted-fg)]"
                aria-label="Has attachments"
              />
            )}
            {email.isStarred && (
              <Star
                className="h-3.5 w-3.5 fill-[var(--color-warning-500)] text-[var(--color-warning-500)]"
                aria-label="Starred"
              />
            )}
          </div>
        </div>

        <p className="truncate text-xs text-[var(--color-muted-fg)]">
          <HighlightedText text={email.preview} highlights={previewHL} />
        </p>

        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <Badge variant="outline" className="text-[10px] capitalize">
            {email.folder}
          </Badge>
          {email.labels.slice(0, 3).map((labelId) => (
            <span
              key={labelId}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted-fg)]"
            >
              {labelId.replace(/^label-/, "")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
