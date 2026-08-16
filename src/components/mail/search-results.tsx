"use client";

/**
 * Search Results — list of search results with highlighted matched terms,
 * a faceted filters panel, sort controls, loading skeleton, and empty state.
 */
import { Search as SearchIcon, ArrowDownUp } from "lucide-react";
import { FacetPanel } from "./search-results/facet-panel";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useSearchStore } from "@/stores/search-store";
import { useEmailStore } from "@/stores/email-store";
import type { SearchSort } from "@/types/search";
import { ResultItem } from "./search-results/result-item";

const SORT_OPTIONS: { value: SearchSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "date", label: "Date (newest)" },
];

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

      <FacetPanel />

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
