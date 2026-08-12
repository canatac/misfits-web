"use client";

/**
 * Search Results — list of search results with highlighted matched terms,
 * a faceted filters panel, sort controls, loading skeleton, and empty state.
 */
import { useMemo, useState } from "react";
import {
  Search as SearchIcon,
  Paperclip,
  Star,
  ArrowDownUp,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSearchStore } from "@/stores/search-store";
import { useEmailStore } from "@/stores/email-store";
import type { Email, Folder } from "@/types/email";
import type { MatchHighlight, SearchSort } from "@/types/search";

// ---------------------------------------------------------------------------
// Highlight rendering
// ---------------------------------------------------------------------------

/**
 * Render text with highlighted matched terms.
 * Supports multiple non-overlapping highlights on the same field.
 */
function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights: MatchHighlight[];
}) {
  if (highlights.length === 0) return <>{text}</>;

  // Sort by start position, filter out overlaps
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const nonOverlapping: MatchHighlight[] = [];
  let lastEnd = -1;
  for (const h of sorted) {
    if (h.start >= lastEnd) {
      nonOverlapping.push(h);
      lastEnd = h.end;
    }
  }

  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (let i = 0; i < nonOverlapping.length; i++) {
    const h = nonOverlapping[i];
    if (h.start > pos) {
      parts.push(text.slice(pos, h.start));
    }
    parts.push(
      <mark
        key={i}
        className="rounded-[var(--radius-sm)] bg-[var(--color-brand-500)]/20 px-0.5 font-semibold text-[var(--color-fg)]"
      >
        {text.slice(h.start, h.end)}
      </mark>
    );
    pos = h.end;
  }
  if (pos < text.length) {
    parts.push(text.slice(pos));
  }

  return <>{parts}</>;
}

/** Get highlights for a specific field from a search result. */
function fieldHighlights(
  highlights: MatchHighlight[],
  field: MatchHighlight["field"]
): MatchHighlight[] {
  return highlights.filter((h) => h.field === field);
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "short" });
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  if (name === "me") return "Me";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Result item
// ---------------------------------------------------------------------------

interface ResultItemProps {
  email: Email;
  highlights: MatchHighlight[];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function ResultItem({
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
      {/* Unread indicator */}
      {!email.isRead && (
        <div
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-brand-500)]"
          aria-label="Unread"
        />
      )}

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(email.from.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
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

        {/* Folder + Labels */}
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

// ---------------------------------------------------------------------------
// Faceted filters panel
// ---------------------------------------------------------------------------

const FOLDER_NAMES: Record<Folder, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  trash: "Trash",
  spam: "Spam",
};

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "date", label: "Date (newest)" },
];

function FacetPanel() {
  const facets = useSearchStore((s) => s.facets);
  const query = useSearchStore((s) => s.query);
  const setSearchQuery = useSearchStore((s) => s.setSearchQuery);
  const executeSearch = useSearchStore((s) => s.executeSearch);

  if (!facets || !query.trim()) return null;

  const folders = Object.entries(facets.folders).filter(
    ([, count]) => count > 0
  );
  const labels = Object.entries(facets.labels).filter(([, count]) => count > 0);

  const appendFilter = (operator: string, value: string) => {
    const newQuery = `${query} ${operator}:${value}`;
    setSearchQuery(newQuery);
    executeSearch();
  };

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
        <Filter className="h-3.5 w-3.5" />
        Refine
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-1.5">
        {facets.isUnread > 0 && (
          <button
            onClick={() => appendFilter("is", "unread")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
          >
            Unread ({facets.isUnread})
          </button>
        )}
        {facets.isStarred > 0 && (
          <button
            onClick={() => appendFilter("is", "starred")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
          >
            <Star className="h-3 w-3" />
            Starred ({facets.isStarred})
          </button>
        )}
        {facets.hasAttachment > 0 && (
          <button
            onClick={() => appendFilter("has", "attachment")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
          >
            <Paperclip className="h-3 w-3" />
            Attachments ({facets.hasAttachment})
          </button>
        )}
      </div>

      {/* Folder facets */}
      {folders.length > 1 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-muted-fg)]">Folders</span>
          <div className="flex flex-wrap gap-1.5">
            {folders.map(([folder, count]) => (
              <button
                key={folder}
                onClick={() => appendFilter("", "")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
                title={`Folder: ${FOLDER_NAMES[folder as Folder] ?? folder}`}
              >
                {FOLDER_NAMES[folder as Folder] ?? folder} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Label facets */}
      {labels.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-muted-fg)]">Labels</span>
          <div className="flex flex-wrap gap-1.5">
            {labels.map(([label, count]) => (
              <button
                key={label}
                onClick={() =>
                  appendFilter("label", label.replace(/^label-/, ""))
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
              >
                {label.replace(/^label-/, "")} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date range facets */}
      {(facets.dateRanges.today > 0 ||
        facets.dateRanges.week > 0 ||
        facets.dateRanges.month > 0) && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-muted-fg)]">Date</span>
          <div className="flex flex-wrap gap-1.5">
            {facets.dateRanges.today > 0 && (
              <button
                onClick={() => appendFilter("after", "1d")}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
              >
                Today ({facets.dateRanges.today})
              </button>
            )}
            {facets.dateRanges.week > 0 && (
              <button
                onClick={() => appendFilter("after", "7d")}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
              >
                This week ({facets.dateRanges.week})
              </button>
            )}
            {facets.dateRanges.month > 0 && (
              <button
                onClick={() => appendFilter("after", "30d")}
                className="inline-flex items-center rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs transition-colors hover:bg-[var(--color-muted)]"
              >
                This month ({facets.dateRanges.month})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search Results
// ---------------------------------------------------------------------------

interface SearchResultsProps {
  className?: string;
  onSelectEmail?: (id: string) => void;
}

export function SearchResults({
  className,
  onSelectEmail,
}: SearchResultsProps) {
  const results = useSearchStore((s) => s.results);
  const isSearching = useSearchStore((s) => s.isSearching);
  const query = useSearchStore((s) => s.query);
  const sort = useSearchStore((s) => s.sort);
  const setSort = useSearchStore((s) => s.setSort);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);

  const handleSelect = (id: string) => {
    selectEmail(id);
    onSelectEmail?.(id);
  };

  const showResults = query.trim().length > 0;

  if (!showResults && !isSearching) return null;

  return (
    <div
      className={cn("flex h-full flex-col bg-[var(--color-bg)]", className)}
      data-testid="search-results"
    >
      {/* Header with sort */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4 text-[var(--color-muted-fg)]" />
          <span className="text-sm font-medium">
            {isSearching
              ? "Searching..."
              : `${results.length} ${results.length === 1 ? "result" : "results"}`}
          </span>
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SearchSort)}>
          <SelectTrigger
            className="h-8 w-[130px]"
            aria-label="Sort search results"
          >
            <ArrowDownUp className="mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Faceted filters */}
      <FacetPanel />

      {/* Results list */}
      <ScrollArea className="flex-1">
        {isSearching && results.length === 0 ? (
          <div
            className="flex flex-col gap-0"
            data-testid="search-results-skeleton"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 border-b border-[var(--color-border)] p-3"
              >
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="No results found"
            description={`No emails match "${query}". Try different keywords or operators.`}
            size="lg"
          />
        ) : (
          <div role="listbox" aria-label="Search results">
            {results.map((result) => (
              <ResultItem
                key={result.email.id}
                email={result.email}
                highlights={result.highlights}
                isSelected={result.email.id === selectedEmailId}
                onSelect={handleSelect}
              />
            ))}
            <div className="h-4" aria-hidden="true" />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
