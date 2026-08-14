"use client";

/**
 * Search Overlay — full-screen search overlay (Linear/Notion command palette style).
 * Triggered by Cmd+/ or clicking the search bar. Shows live results as you type,
 * recent searches, and saved searches.
 */
import { useEffect, useRef, useCallback, useState } from "react";
import {
  Search as SearchIcon,
  X,
  Clock,
  Bookmark,
  ArrowRight,
  Save,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useSearchStore } from "@/stores/search-store";
import { useEmailStore } from "@/stores/email-store";
import {
  OPERATOR_META,
  type MatchHighlight,
  type OperatorMeta,
} from "@/types/search";
import { getActiveOperator } from "@/lib/search-parser";
import { searchEmails } from "@/lib/search-engine";
import { mockEmails } from "@/lib/mock-emails";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import {
  getInitials,
  formatDate,
  fieldHighlights,
  HighlightedText,
} from "@/lib/search-overlay-utils";

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showOperatorHints, setShowOperatorHints] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const query = useSearchStore((s) => s.query);
  const setSearchQuery = useSearchStore((s) => s.setSearchQuery);
  const executeSearch = useSearchStore((s) => s.executeSearch);
  const addHistoryEntry = useSearchStore((s) => s.addHistoryEntry);
  const saveSearch = useSearchStore((s) => s.saveSearch);
  const savedSearches = useSearchStore((s) => s.savedSearches);
  const searchHistory = useSearchStore((s) => s.searchHistory);
  const deleteSavedSearch = useSearchStore((s) => s.deleteSavedSearch);
  const applySavedSearch = useSearchStore((s) => s.applySavedSearch);

  const selectEmail = useEmailStore((s) => s.selectEmail);

  // Perform search locally for the overlay (fast, synchronous)
  const { results, isSearching } = (() => {
    if (!query.trim()) return { results: [], isSearching: false };
    const { results } = searchEmails(query, mockEmails, "relevance");
    return { results, isSearching: false };
  })();

  // Focus input when overlay opens
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

  // Reset active index when results change
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
      executeSearch();
    },
    [setSearchQuery, executeSearch]
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
          if (result) {
            handleSelectResult(result.email.id);
          }
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
        return;
      }
    },
    [
      results,
      activeIndex,
      handleSelectResult,
      addHistoryEntry,
      query,
      onOpenChange,
    ]
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
      executeSearch();
      requestAnimationFrame(() => {
        const pos =
          (match ? cursorPos - match[0].length : cursorPos) +
          op.operator.length +
          1;
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(pos, pos);
      });
    },
    [query, setSearchQuery, executeSearch]
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
  const showRecentSearches = !hasQuery && searchHistory.length > 0;
  const showSavedSearches = !hasQuery && savedSearches.length > 0;
  const showResults = hasQuery && results.length > 0;
  const showEmpty = hasQuery && results.length === 0 && !isSearching;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="max-w-3xl gap-0 overflow-hidden rounded-2xl border border-[#242427] bg-[#0A0A0B] p-0"
        aria-label="Search mail"
      >
        {/* Search input */}
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
                executeSearch();
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

        {/* Operator autocomplete */}
        {showOperatorHints && (
          <div className="border-b border-[#242427] bg-[#121214]/80 p-2">
            <div className="mb-1 px-1 text-xs font-semibold tracking-wide text-[#A1A1AA] uppercase">
              Opérateurs intelligents
            </div>
            <div className="flex flex-wrap gap-1">
              {filteredOperators.map((op) => (
                <button
                  key={op.operator}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertOperator(op);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#242427] bg-[#0A0A0B] px-2.5 py-1 text-xs text-[#D4D4D8] transition-colors hover:border-[#C49B66]/40 hover:bg-[#1D1D20]"
                >
                  <span className="font-mono font-medium text-[var(--color-brand-500)]">
                    {op.label}
                  </span>
                  <span className="text-[var(--color-muted-fg)]">
                    {op.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="max-h-[400px]">
          {/* Results */}
          {showResults && (
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
                    onClick={() => handleSelectResult(result.email.id)}
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
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize"
                        >
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
          )}

          {/* Recent searches */}
          {showRecentSearches && (
            <div className="p-2">
              <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
                Récentes
              </div>
              {searchHistory.slice(0, 8).map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setSearchQuery(entry.query);
                    executeSearch();
                  }}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)]"
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
                  <span className="flex-1 truncate">{entry.query}</span>
                </button>
              ))}
            </div>
          )}

          {/* Saved searches */}
          {showSavedSearches && (
            <div className="p-2">
              <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
                Sauvegardées
              </div>
              {savedSearches.map((saved) => (
                <div
                  key={saved.id}
                  className="group flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors hover:bg-[var(--color-muted)]"
                >
                  <button
                    onClick={() => {
                      applySavedSearch(saved);
                      onOpenChange(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {saved.name}
                      </span>
                      <span className="truncate text-xs text-[var(--color-muted-fg)]">
                        {saved.query}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => deleteSavedSearch(saved.id)}
                    aria-label={`Delete saved search: ${saved.name}`}
                  >
                    <X className="h-3 w-3 text-[var(--color-danger-500)]" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <SearchIcon className="h-10 w-10 text-[var(--color-muted-fg)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-fg)]">
                  Aucun résultat
                </p>
                <p className="text-xs text-[var(--color-muted-fg)]">
                  No emails match &ldquo;{query}&rdquo;. Try different keywords
                  or operators.
                </p>
              </div>
            </div>
          )}

          {/* Initial state — no query, no history, no saved searches */}
          {!hasQuery && !showRecentSearches && !showSavedSearches && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <SearchIcon className="h-10 w-10 text-[var(--color-muted-fg)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-fg)]">
                  Rechercher dans votre mail
                </p>
                <p className="text-xs text-[var(--color-muted-fg)]">
                  Use operators like <span className="font-mono">from:</span>,{" "}
                  <span className="font-mono">subject:</span>,{" "}
                  <span className="font-mono">is:unread</span>,{" "}
                  <span className="font-mono">has:attachment</span>
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {hasQuery && results.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#242427] bg-[#121214] px-3 py-2 text-xs text-[#A1A1AA]">
            <span>
              {results.length} {results.length === 1 ? "résultat" : "résultats"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 gap-1 border border-[#242427] bg-[#1D1D20] text-[#E0E0E0] hover:border-[#C49B66]/50"
                onClick={() => saveSearch(query, query)}
              >
                <Save className="h-3 w-3 text-[#C49B66]" />
                Sauvegarder la recherche
              </Button>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[#242427] bg-[#1D1D20] px-1">
                  ↑↓
                </kbd>
                naviguer
                <kbd className="rounded border border-[#242427] bg-[#1D1D20] px-1">
                  ↵
                </kbd>
                ouvrir
              </span>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
