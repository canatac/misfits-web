"use client";

/**
 * Search Bar — global search input with operator autocomplete.
 * Shows operator hints as the user types, a clear button, search history dropdown,
 * and a results count. Wires Cmd+/ focus via the global window hook.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { Search, X, ChevronDown, History, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { OPERATOR_META, type OperatorMeta } from "@/types/search";
import { getActiveOperator } from "@/lib/search-parser";
import { useSearchStore } from "@/stores/search-store";
import { useSearchHistory } from "@/hooks/use-search";

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
  const setSearchQuery = useSearchStore((s) => s.setSearchQuery);
  const executeSearch = useSearchStore((s) => s.executeSearch);
  const addHistoryEntry = useSearchStore((s) => s.addHistoryEntry);
  const saveSearch = useSearchStore((s) => s.saveSearch);
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

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      // Check if user is typing an operator
      const cursorPos = e.target.selectionStart ?? value.length;
      const activeOp = getActiveOperator(value, cursorPos);
      setShowOperatorHints(!!activeOp && activeOp.partial.length < 5);

      // Execute search (debounced via the store/hook)
      executeSearch();
    },
    [setSearchQuery, executeSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim()) {
          addHistoryEntry(query);
          executeSearch();
        }
        setShowHistory(false);
        setShowOperatorHints(false);
      }
      if (e.key === "Escape") {
        if (query) {
          setSearchQuery("");
          executeSearch();
        }
        setShowOperatorHints(false);
        setShowHistory(false);
        inputRef.current?.blur();
      }
      if (e.key === "ArrowDown" && !query) {
        e.preventDefault();
        setShowHistory(true);
      }
    },
    [query, setSearchQuery, executeSearch, addHistoryEntry]
  );

  const handleClear = useCallback(() => {
    setSearchQuery("");
    executeSearch();
    inputRef.current?.focus();
  }, [setSearchQuery, executeSearch]);

  const handleSave = useCallback(() => {
    if (query.trim()) {
      const name = window.prompt("Save this search as:", query);
      if (name !== null) {
        saveSearch(name, query);
      }
    }
  }, [query, saveSearch]);

  const insertOperator = useCallback(
    (op: OperatorMeta) => {
      const cursorPos = inputRef.current?.selectionStart ?? query.length;
      const before = query.slice(0, cursorPos);
      const after = query.slice(cursorPos);

      // Replace the partial operator being typed
      const match = before.match(/(\w+:)(?:"([^"]*)"|'([^']*)'?|(\S*))$/);
      let newQuery: string;
      if (match) {
        const replaceStart = cursorPos - match[0].length;
        newQuery =
          query.slice(0, replaceStart) +
          (op.hasValue ? `${op.operator}:` : `${op.operator}: `) +
          after;
      } else {
        newQuery = before + `${op.operator}:` + (after ? " " + after : "");
      }
      setSearchQuery(newQuery);
      setShowOperatorHints(false);

      // Focus and position cursor after the operator
      requestAnimationFrame(() => {
        const pos =
          (match ? cursorPos - match[0].length : cursorPos) +
          op.operator.length +
          1;
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(pos, pos);
      });
    },
    [query, setSearchQuery]
  );

  const activeOperator = (() => {
    const cursorPos = inputRef.current?.selectionStart ?? query.length;
    return getActiveOperator(query, cursorPos);
  })();

  const filteredOperators = activeOperator
    ? OPERATOR_META.filter(
        (op) =>
          op.operator.startsWith(activeOperator.operator) ||
          op.operator.includes(activeOperator.operator)
      )
    : OPERATOR_META;

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
            // Delay to allow click events on dropdown items
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

        {/* Right-side actions */}
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
            <Popover open={showHistory} onOpenChange={setShowHistory}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Search history"
                  title="Recent searches"
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
                  <span className="text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
                    Recent Searches
                  </span>
                  {searchHistory.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={clear}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {searchHistory.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setSearchQuery(entry.query);
                        executeSearch();
                        setShowHistory(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
                    >
                      <History className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
                      <span className="flex-1 truncate">{entry.query}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Results count badge */}
      {query.trim() && (
        <Badge variant="secondary" className="shrink-0">
          {results.length} {results.length === 1 ? "result" : "results"}
        </Badge>
      )}

      {/* Operator autocomplete dropdown */}
      {showOperatorHints && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover)] shadow-[var(--shadow-lg)]">
          <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
            Search Operators
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredOperators.map((op) => (
              <button
                key={op.operator}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertOperator(op);
                }}
                className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-left transition-colors hover:bg-[var(--color-muted)]"
              >
                <span className="w-20 shrink-0 font-mono text-xs font-medium text-[var(--color-brand-500)]">
                  {op.label}
                </span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm text-[var(--color-fg)]">
                    {op.description}
                  </span>
                  <span className="text-xs text-[var(--color-muted-fg)]">
                    {op.example}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
