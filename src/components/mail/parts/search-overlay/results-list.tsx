"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SearchResult } from "@/types/search";
import {
  getInitials,
  formatDate,
  fieldHighlights,
  HighlightedText,
} from "@/lib/search-overlay-utils";

export function ResultsList({
  results,
  activeIndex,
  setActiveIndex,
  onSelect,
}: {
  results: SearchResult[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="listbox" aria-label="Search results" className="p-1">
      {results.slice(0, 50).map((result, index) => {
        const subjectHL = fieldHighlights(result.highlights, "subject");
        const fromHL = fieldHighlights(result.highlights, "from");
        const previewHL = fieldHighlights(result.highlights, "preview");
        return (
          <div
            key={result.email.id}
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => onSelect(result.email.id)}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors",
              index === activeIndex && "bg-[var(--color-accent)]"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(result.email.from.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  <HighlightedText
                    text={result.email.from.name}
                    highlights={fromHL}
                  />
                </span>
                <span className="shrink-0 text-xs text-[var(--color-muted-fg)]">
                  {formatDate(result.email.date)}
                </span>
              </div>
              <span className="truncate text-sm text-[var(--color-fg)]">
                <HighlightedText
                  text={result.email.subject}
                  highlights={subjectHL}
                />
              </span>
              <span className="truncate text-xs text-[var(--color-muted-fg)]">
                <HighlightedText
                  text={result.email.preview}
                  highlights={previewHL}
                />
              </span>
              <div className="flex items-center gap-1 pt-0.5">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {result.email.folder}
                </Badge>
                {result.email.hasAttachments && (
                  <Badge variant="secondary" className="text-[10px]">
                    attachment
                  </Badge>
                )}
              </div>
            </div>
            {index === activeIndex && (
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-muted-fg)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
