/**
 * Zustand store for search state management.
 * Handles query, parsed query, results, saved searches, and search history.
 * Persists saved searches and history to localStorage.
 */
import { create } from "zustand";
import type { Email } from "@/types/email";
import type {
  SavedSearch,
  SearchHistory,
  SearchQuery,
  SearchResult,
  SearchFacets,
  SearchSort,
} from "@/types/search";
import { parseSearchQuery } from "@/lib/search-parser";
import { searchEmails } from "@/lib/search-engine";
import { useEmailStore } from "@/stores/email-store";

const SAVED_SEARCHES_KEY = "misfits:saved-searches";
const SEARCH_HISTORY_KEY = "misfits:search-history";
const MAX_HISTORY = 20;

function uid(prefix = "id"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

function loadHistory(): SearchHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SearchHistory[]) : [];
  } catch {
    return [];
  }
}

function persistSavedSearches(items: SavedSearch[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function persistHistory(items: SearchHistory[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export interface SearchStore {
  // State
  query: string;
  parsedQuery: SearchQuery | null;
  results: SearchResult[];
  facets: SearchFacets | null;
  isSearching: boolean;
  sort: SearchSort;
  savedSearches: SavedSearch[];
  searchHistory: SearchHistory[];

  // Actions
  setSearchQuery: (query: string) => void;
  setSort: (sort: SearchSort) => void;
  executeSearch: (emails?: Email[]) => void;
  saveSearch: (name: string, query?: string) => void;
  deleteSavedSearch: (id: string) => void;
  clearHistory: () => void;
  applySavedSearch: (saved: SavedSearch) => void;
  addHistoryEntry: (query: string) => void;
}

const emptyParsed = parseSearchQuery("");

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: "",
  parsedQuery: null,
  results: [],
  facets: null,
  isSearching: false,
  sort: "relevance",
  savedSearches: loadSavedSearches(),
  searchHistory: loadHistory(),

  setSearchQuery: (query) => {
    const parsedQuery = query.trim() ? parseSearchQuery(query) : null;
    set({ query, parsedQuery });
  },

  setSort: (sort) => {
    set({ sort });
    const { query } = get();
    if (query.trim()) {
      get().executeSearch();
    }
  },

  executeSearch: (emails) => {
    const { query, sort } = get();
    if (!query.trim()) {
      set({ results: [], facets: null, isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const corpus = emails ?? useEmailStore.getState().emails;
      const { results, facets } = searchEmails(query, corpus, sort);
      set({ results, facets, isSearching: false });
    } catch {
      set({ results: [], facets: null, isSearching: false });
    }
  },

  saveSearch: (name, query) => {
    const q = query ?? get().query;
    if (!q.trim()) return;
    const saved: SavedSearch = {
      id: uid("saved"),
      name: name.trim() || q,
      query: q,
      createdAt: new Date().toISOString(),
    };
    const updated = [
      saved,
      ...get().savedSearches.filter((s) => s.query !== q),
    ];
    set({ savedSearches: updated });
    persistSavedSearches(updated);
  },

  deleteSavedSearch: (id) => {
    const updated = get().savedSearches.filter((s) => s.id !== id);
    set({ savedSearches: updated });
    persistSavedSearches(updated);
  },

  clearHistory: () => {
    set({ searchHistory: [] });
    persistHistory([]);
  },

  applySavedSearch: (saved) => {
    set({ query: saved.query, parsedQuery: parseSearchQuery(saved.query) });
    get().executeSearch();
  },

  addHistoryEntry: (query) => {
    if (!query.trim()) return;
    const existing = get().searchHistory;
    // Remove duplicates (same query)
    const filtered = existing.filter((h) => h.query !== query);
    const entry: SearchHistory = {
      id: uid("hist"),
      query,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
    set({ searchHistory: updated });
    persistHistory(updated);
  },
}));
