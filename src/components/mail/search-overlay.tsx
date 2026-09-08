"use client";

/**
 * Search Overlay — full-screen search overlay (Linear/Notion command palette style).
 */
import { useEffect, useRef, useCallback, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useSearchStore } from "@/stores/search-store";
import { useEmailStore } from "@/stores/email-store";
import { OPERATOR_META, type OperatorMeta } from "@/types/search";
import { getActiveOperator } from "@/lib/search-parser";
import {
  OperatorHints,
  ResultsList,
  RecentSearches,
  SavedSearches,
  EmptyResult,
  InitialState,
  ResultsFooter,
} from "./parts/search-overlay/sub-components";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const searchTokenRef = useRef(0);
  const [showOperatorHints, setShowOperatorHints] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [searchLatencyMs, setSearchLatencyMs] = useState(0);

  const query = useSearchStore((s) => s.query);
  const setSearchQuery = useSearchStore((s) => s.setSearchQuery);
  const executeSearch = useSearchStore((s) => s.executeSearch);
  const results = useSearchStore((s) => s.results);
  const isSearching = useSearchStore((s) => s.isSearching);
  const addHistoryEntry = useSearchStore((s) => s.addHistoryEntry);
  const saveSearch = useSearchStore((s) => s.saveSearch);
  const savedSearches = useSearchStore((s) => s.savedSearches);
  const searchHistory = useSearchStore((s) => s.searchHistory);
  const deleteSavedSearch = useSearchStore((s) => s.deleteSavedSearch);
  const applySavedSearch = useSearchStore((s) => s.applySavedSearch);
  const emails = useEmailStore((s) => s.emails);
  const selectEmail = useEmailStore((s) => s.selectEmail);

  const runSearch = useCallback(
    (
      nextQuery: string,
      corpus: typeof emails,
      opts?: {
        immediate?: boolean;
      }
    ) => {
      const immediate = opts?.immediate ?? false;

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (!nextQuery.trim()) {
        searchTokenRef.current += 1;
        setIsDebouncing(false);
        setSearchLatencyMs(0);
        executeSearch(corpus);
        return;
      }

      const run = () => {
        const token = ++searchTokenRef.current;
        setIsDebouncing(false);
        const startedAt = performance.now();
        executeSearch(corpus);
        if (token === searchTokenRef.current) {
          setSearchLatencyMs(Math.max(0, Math.round(performance.now() - startedAt)));
        }
      };

      if (immediate) {
        run();
        return;
      }

      setIsDebouncing(true);
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        run();
      }, 120);
    },
    [executeSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    } else {
      setShowOperatorHints(false);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      const cursorPos = e.target.selectionStart ?? value.length;
      const activeOp = getActiveOperator(value, cursorPos);
      setShowOperatorHints(!!activeOp && activeOp.partial.length < 5);
      runSearch(value, emails);
    },
    [setSearchQuery, runSearch, emails]
  );

  const handleSelectResult = useCallback(
    (id: string) => {
      selectEmail(id);
      addHistoryEntry(query);
      onOpenChange(false);
    },
    [selectEmail, addHistoryEntry, query, onOpenChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (results.length > 0) {
          const result = results[activeIndex];
          if (result) handleSelectResult(result.email.id);
        } else if (query.trim()) {
          addHistoryEntry(query);
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    },
    [results, activeIndex, handleSelectResult, addHistoryEntry, query, onOpenChange]
  );

  const insertOperator = useCallback(
    (op: OperatorMeta) => {
      const cursorPos = inputRef.current?.selectionStart ?? query.length;
      const before = query.slice(0, cursorPos);
      const after = query.slice(cursorPos);
      const match = before.match(/(\w+:)(?:"([^"]*)"|'([^']*)'?|(\S*))$/);
      let newQuery: string;
      if (match) {
        const replaceStart = cursorPos - match[0].length;
        newQuery = query.slice(0, replaceStart) + `${op.operator}:` + after;
      } else {
        newQuery = before + `${op.operator}:` + (after ? " " + after : "");
      }
      setSearchQuery(newQuery);
      setShowOperatorHints(false);
      runSearch(newQuery, emails, { immediate: true });
      requestAnimationFrame(() => {
        const pos =
          (match ? cursorPos - match[0].length : cursorPos) +
          op.operator.length +
          1;
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(pos, pos);
      });
    },
    [query, setSearchQuery, runSearch, emails]
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

  const hasQuery = query.trim().length > 0;
  const showSkeleton = hasQuery && (isDebouncing || isSearching);
  const showRecentSearches = !hasQuery && searchHistory.length > 0;
  const showSavedSearches = !hasQuery && savedSearches.length > 0;
  const showResults = hasQuery && results.length > 0 && !showSkeleton;
  const showEmpty = hasQuery && results.length === 0 && !showSkeleton;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="max-w-3xl gap-0 overflow-hidden rounded-2xl border border-[#242427] bg-[#0A0A0B] p-0"
        aria-label="Search mail"
      >
        <div className="flex items-center gap-2 border-b border-[#242427] bg-[#121214] px-4 py-3">
          <SearchIcon className="h-5 w-5 shrink-0 text-[var(--color-muted-fg)]" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Recherche avancée (from:, to:, subject:, is:unread, has:attachment, before:, after:)"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent px-0 text-base text-[#E0E0E0] shadow-none placeholder:text-[#71717A] focus-visible:ring-0"
            aria-label="Search emails"
            data-testid="search-overlay-input"
          />
          {hasQuery && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                setSearchQuery("");
                runSearch("", emails, { immediate: true });
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Separator orientation="vertical" className="h-6" />
          <kbd className="shrink-0 rounded border border-[#242427] bg-[#1D1D20] px-1.5 py-0.5 text-xs text-[#71717A]">
            ESC
          </kbd>
        </div>

        {showOperatorHints && (
          <OperatorHints operators={filteredOperators} onInsert={insertOperator} />
        )}

        <ScrollArea className="max-h-[400px]">
          {showSkeleton && (
            <div className="space-y-2 p-3" data-testid="search-overlay-skeleton">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-md border border-[#242427] bg-[#121214]"
                />
              ))}
            </div>
          )}
          {showResults && (
            <ResultsList
              results={results}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              onSelect={handleSelectResult}
            />
          )}
          {showRecentSearches && (
            <RecentSearches
              history={searchHistory}
              onPick={(q) => {
                setSearchQuery(q);
                runSearch(q, emails, { immediate: true });
              }}
            />
          )}
          {showSavedSearches && (
            <SavedSearches
              saved={savedSearches}
              onApply={(s) => {
                applySavedSearch(s);
                onOpenChange(false);
              }}
              onDelete={deleteSavedSearch}
            />
          )}
          {showEmpty && <EmptyResult query={query} />}
          {!hasQuery && !showRecentSearches && !showSavedSearches && <InitialState />}
        </ScrollArea>

        {hasQuery && results.length > 0 && (
          <ResultsFooter
            count={results.length}
            elapsedMs={searchLatencyMs}
            onSave={() => saveSearch(query, query)}
          />
        )}
      </ModalContent>
    </Modal>
  );
}
