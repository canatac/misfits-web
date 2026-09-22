/**
 * Index inverti + moteur de recherche haut niveau.
 * Compose parser (@/lib/search-parser) + matcher + scorer.
 */
import type { Email } from "@/types/email";
import type {
  SearchFacets,
  SearchQuery,
  SearchResult,
  SearchSort,
} from "@/types/search";
import { parseSearchQuery } from "@/lib/search-parser";
import { normalize, stripHtml } from "./text-utils";
import { applyFilters, collectHighlights } from "./matcher";
import { computeFacets, scoreEmail } from "./scorer";

function sortResults(results: SearchResult[], sort: SearchSort): void {
  if (sort === "date") {
    results.sort(
      (a, b) =>
        new Date(b.email.date).getTime() - new Date(a.email.date).getTime()
    );
  } else {
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.email.date).getTime() - new Date(a.email.date).getTime()
      );
    });
  }
}

/**
 * SearchIndex — builds a lightweight inverted index over a corpus of emails
 * and memoizes search results for repeated queries. Designed for 10k+ emails.
 */
export class SearchIndex {
  private emails: Email[];
  private index: Map<string, Set<string>>;
  private queryCache: Map<
    string,
    { results: SearchResult[]; facets: SearchFacets }
  >;
  private corpusTokens: Map<string, string>;

  constructor(emails: Email[]) {
    this.emails = emails;
    this.index = new Map();
    this.queryCache = new Map();
    this.corpusTokens = new Map();
    this.buildIndex();
  }

  private buildIndex(): void {
    for (const email of this.emails) {
      const tokens = this.tokenizeEmail(email);
      const corpus = tokens.join(" ");
      this.corpusTokens.set(email.id, corpus);

      for (const token of tokens) {
        let set = this.index.get(token);
        if (!set) {
          set = new Set();
          this.index.set(token, set);
        }
        set.add(email.id);
      }
    }
  }

  private tokenizeEmail(email: Email): string[] {
    const text = normalize(
      [
        email.subject,
        email.from.name,
        email.from.address,
        email.to.map((t) => `${t.name} ${t.address}`).join(" "),
        email.preview,
        stripHtml(email.body),
        email.attachments.map((a) => a.filename).join(" "),
        email.labels.join(" "),
      ].join(" ")
    );
    return text.split(" ").filter((t: string) => t.length > 0);
  }

  private getCorpus(emailId: string): string {
    return this.corpusTokens.get(emailId) ?? "";
  }

  search(
    query: string,
    sort: SearchSort = "relevance"
  ): {
    results: SearchResult[];
    facets: SearchFacets;
  } {
    const cacheKey = `${query}::${sort}`;
    const cached = this.queryCache.get(cacheKey);
    if (cached) return cached;

    const parsed = parseSearchQuery(query);
    const terms = parsed.textTerms
      .map((t: string) => normalize(t))
      .filter((t: string) => t.length > 0);

    let candidates: Email[];

    if (terms.length > 0) {
      const candidateIds = new Set<string>();
      for (const term of terms) {
        for (const [token, ids] of this.index) {
          if (token.includes(term) || term.includes(token)) {
            for (const id of ids) candidateIds.add(id);
          }
        }
        if (candidateIds.size === 0) {
          for (const email of this.emails) {
            if (this.getCorpus(email.id).includes(term)) {
              candidateIds.add(email.id);
            }
          }
        }
      }
      candidates = this.emails.filter((e) => candidateIds.has(e.id));
    } else {
      candidates = this.emails;
    }

    const filtered = candidates.filter((e) => applyFilters(e, parsed.filters));

    const results: SearchResult[] = filtered.map((email) => {
      const highlights =
        terms.length > 0 ? collectHighlights(email, terms) : [];
      const score = scoreEmail(email, terms, highlights);
      return { email, score, highlights };
    });

    sortResults(results, sort);

    const facets = computeFacets(filtered);

    const result = { results, facets };
    this.queryCache.set(cacheKey, result);
    return result;
  }

  invalidate(): void {
    this.queryCache.clear();
  }

  update(emails: Email[]): void {
    this.emails = emails;
    this.index.clear();
    this.queryCache.clear();
    this.corpusTokens.clear();
    this.buildIndex();
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor
// ---------------------------------------------------------------------------

let globalIndex: SearchIndex | null = null;

export function initSearchIndex(emails: Email[]): SearchIndex {
  if (globalIndex) {
    globalIndex.update(emails);
  } else {
    globalIndex = new SearchIndex(emails);
  }
  return globalIndex;
}

export function getSearchIndex(): SearchIndex | null {
  return globalIndex;
}

export function searchEmails(
  query: string,
  emails: Email[],
  sort: SearchSort = "relevance"
): { results: SearchResult[]; facets: SearchFacets } {
  if (globalIndex) {
    return globalIndex.search(query, sort);
  }
  const index = initSearchIndex(emails);
  return index.search(query, sort);
}

export function searchParsed(
  parsed: SearchQuery,
  emails: Email[],
  sort: SearchSort = "relevance"
): { results: SearchResult[]; facets: SearchFacets } {
  const terms = parsed.textTerms
    .map((t: string) => normalize(t))
    .filter((t: string) => t.length > 0);
  const filtered = emails.filter((e) => applyFilters(e, parsed.filters));

  const results: SearchResult[] = filtered.map((email) => {
    const highlights = terms.length > 0 ? collectHighlights(email, terms) : [];
    const score = scoreEmail(email, terms, highlights);
    return { email, score, highlights };
  });

  sortResults(results, sort);

  return { results, facets: computeFacets(filtered) };
}
