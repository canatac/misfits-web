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
import { Badge } from "@/components/ui/badge";
import { OPERATOR_META, type OperatorMeta } from "@/types/search";
import { getActiveOperator } from "@/lib/search-parser";
import { useSearchStore } from "@/stores/search-store";
import { useSearchHistory } from "@/hooks/use-search";
import {
  SearchHistoryPopover,
  OperatorHintsPanel,
} from "./search-bar-dropdowns";

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
      const cursorPos = e.target.selectionStart ?? value.length;
      const activeOp = getActiveOperator(value, cursorPos);
      setShowOperatorHints(!!activeOp && activeOp.partial.length < 5);
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

  const handleHistorySelect = useCallback(
    (q: string) => {
      setSearchQuery(q);
      executeSearch();
      setShowHistory(false);
    },
    [setSearchQuery, executeSearch]
  );

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
