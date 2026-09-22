"use client";

/**
 * Search Bar — global search input with operator autocomplete.
 * Shows operator hints as the user types, a clear button, search history dropdown,
 * and a results count. Wires Cmd+/ focus via the global window hook.
 */
import { useRef, useState, useEffect } from "react";
import { Search, X, History, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchStore } from "@/stores/search-store";
import { useSearchHistory } from "@/hooks/use-search";
import {
  SearchHistoryPopover,
  OperatorHintsPanel,
} from "./search-bar-dropdowns";
import { useSearchBarHandlers } from "./search-bar/use-search-bar-handlers";

interface SearchBarProps {
  className?: string;
  onOpenOverlay?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  className,
  onOpenOverlay,
  autoFocus,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showOperatorHints, setShowOperatorHints] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const query = useSearchStore((s) => s.query);
  const results = useSearchStore((s) => s.results);

  const { searchHistory, clear } = useSearchHistory();

  // Focus search via global window hook (used by keyboard shortcuts)
  useEffect(() => {
    const w = window as Window & { __mailFocusSearch?: () => void };
    w.__mailFocusSearch = () => {
      if (onOpenOverlay) {
        onOpenOverlay();
      } else {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    return () => {
      delete (window as Window & { __mailFocusSearch?: () => void })
        .__mailFocusSearch;
    };
  }, [onOpenOverlay]);

  const {
    handleChange,
    handleKeyDown,
    handleClear,
    handleSave,
    insertOperator,
    handleHistorySelect,
    filteredOperators,
  } = useSearchBarHandlers({
    inputRef,
    setShowOperatorHints,
    setShowHistory,
  });

  return (
    <div className={cn("relative flex items-center gap-1", className)}>
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-fg)]" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search mail... (use from:, to:, subject:, is:unread, etc.)"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!query && searchHistory.length > 0) setShowHistory(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowHistory(false);
              setShowOperatorHints(false);
            }, 200);
          }}
          className="pr-20 pl-9"
          aria-label="Search emails"
          data-testid="search-bar-input"
          autoFocus={autoFocus}
        />

        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
          {query && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleSave}
              aria-label="Save this search"
              title="Save this search"
            >
              <Save className="h-3.5 w-3.5" />
            </Button>
          )}
          {query && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleClear}
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          {!query && searchHistory.length > 0 && (
            <SearchHistoryPopover
              open={showHistory}
              onOpenChange={setShowHistory}
              searchHistory={searchHistory}
              onSelect={handleHistorySelect}
              onClear={clear}
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label="Search history"
                title="Recent searches"
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </SearchHistoryPopover>
          )}
        </div>
      </div>

      {query.trim() && (
        <Badge variant="secondary" className="shrink-0">
          {results.length} {results.length === 1 ? "result" : "results"}
        </Badge>
      )}

      {showOperatorHints && (
        <OperatorHintsPanel
          operators={filteredOperators}
          onInsert={insertOperator}
        />
      )}
    </div>
  );
}
