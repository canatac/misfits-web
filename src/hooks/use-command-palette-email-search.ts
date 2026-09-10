"use client";

import { useState, useCallback, useEffect } from "react";
import { useEmailStore } from "@/stores/email-store";
import { searchEmails } from "@/lib/search-engine";
import type { SearchResult } from "@/types/search";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 8;

export function useCommandPaletteEmailSearch(query: string) {
  const emails = useEmailStore((s) => s.emails);
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = useCallback(
    (q: string) => {
      if (q.trim().length < MIN_QUERY_LENGTH) {
        setResults([]);
        return;
      }

      try {
        const { results: searchResults } = searchEmails(q, emails, "relevance");
        setResults(searchResults.slice(0, MAX_RESULTS));
      } catch {
        setResults([]);
      }
    },
    [emails]
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  return { results };
}
