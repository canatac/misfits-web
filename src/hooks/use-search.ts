/**
 * Search hooks — debounced search execution with TanStack Query,
 * saved searches CRUD, and search history management.
 */
import { useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockEmails } from "@/lib/mock-emails";
import { useSearchStore } from "@/stores/search-store";
import { searchEmails } from "@/lib/search-engine";
import type { SearchSort } from "@/types/search";

const DEBOUNCE_MS = 200;

/**
 * useSearch — debounced search execution.
 * Watches the query string from the search store and returns results via TanStack Query.
 */
export function useSearch(query: string, sort: SearchSort = "relevance") {
  const trimmed = query.trim();

  const result = useQuery({
    queryKey: ["search", trimmed, sort],
    queryFn: async () => {
      if (!trimmed) return { results: [], facets: null };
      // Simulate a tiny delay for the debounce UX; actual search is synchronous.
      await new Promise((r) => setTimeout(r, DEBOUNCE_MS));
      const { results, facets } = searchEmails(trimmed, mockEmails, sort);
      return { results, facets };
    },
    enabled: trimmed.length > 0,
    staleTime: 30_000,
  });

  return {
    results: result.data?.results ?? [],
    facets: result.data?.facets ?? null,
    isSearching: result.isFetching,
    isStale: result.isStale,
  };
}

/**
 * useSavedSearches — CRUD for saved searches.
 */
export function useSavedSearches() {
  const savedSearches = useSearchStore((s) => s.savedSearches);
  const saveSearch = useSearchStore((s) => s.saveSearch);
  const deleteSavedSearch = useSearchStore((s) => s.deleteSavedSearch);
  const applySavedSearch = useSearchStore((s) => s.applySavedSearch);

  const create = useCallback(
    (name: string, query: string) => {
      saveSearch(name, query);
    },
    [saveSearch]
  );

  const remove = useCallback(
    (id: string) => {
      deleteSavedSearch(id);
    },
    [deleteSavedSearch]
  );

  const apply = useCallback(
    (id: string) => {
      const saved = savedSearches.find((s) => s.id === id);
      if (saved) applySavedSearch(saved);
    },
    [savedSearches, applySavedSearch]
  );

  return {
    savedSearches,
    create,
    remove,
    apply,
  };
}

/**
 * useSearchHistory — manage recent search queries.
 */
export function useSearchHistory() {
  const searchHistory = useSearchStore((s) => s.searchHistory);
  const addHistoryEntry = useSearchStore((s) => s.addHistoryEntry);
  const clearHistory = useSearchStore((s) => s.clearHistory);

  const add = useCallback(
    (query: string) => {
      addHistoryEntry(query);
    },
    [addHistoryEntry]
  );

  const clear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  return useMemo(
    () => ({ searchHistory, add, clear }),
    [searchHistory, add, clear]
  );
}
