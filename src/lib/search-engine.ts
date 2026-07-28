/**
 * Search engine — full-text + operator-filtered search over a set of emails.
 *
 * Features:
 * - Full-text search across subject, body, sender, recipients
 * - Operator filters (from, to, subject, has:attachment, before, after, is:unread,
 *   is:starred, label, filename, larger, smaller)
 * - Lightweight fuzzy matching (subsequence / Levenshtein for short terms)
 * - Highlight matched terms with character positions
 * - Sort by relevance or date
 * - Performance: builds a per-corpus inverted index + memoization for 10k+ emails
 */
import type { Email } from "@/types/email";
import type {
  MatchHighlight,
  SearchFacets,
  SearchFilters,
  SearchQuery,
  SearchResult,
  SearchSort,
} from "@/types/search";
import { parseSearchQuery } from "@/lib/search-parser";

/** Strip HTML tags from a body string for text matching. */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize text for matching: lowercase, collapse whitespace. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Levenshtein distance (bounded) for short fuzzy matching. */
function levenshtein(a: string, b: string, maxDist: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > maxDist) return maxDist + 1;
  if (al === 0) return bl;
  if (bl === 0) return al;

  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDist) return maxDist + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

/**
 * Test whether `term` matches a substring of `text` (case-insensitive),
 * or is a fuzzy subsequence match for short terms (≤4 chars).
 * Returns the match start index, or -1 if no match.
 */
function matchTerm(text: string, term: string): number {
  if (!term) return -1;
  const idx = text.indexOf(term);
  if (idx >= 0) return idx;

  // Fuzzy for short terms: allow 1 edit distance for terms of length 3–4
  if (term.length >= 3 && term.length <= 4) {
    const words = text.split(" ");
    for (const word of words) {
      if (Math.abs(word.length - term.length) <= 1) {
        const dist = levenshtein(term, word, 1);
        if (dist <= 1) return text.indexOf(word);
      }
    }
  }
  return -1;
}

/** Collect all highlight positions for a set of terms across an email's fields. */
function collectHighlights(
  email: Email,
  terms: string[],
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];
  const subject = normalize(email.subject);
  const fromName = normalize(email.from.name);
  const fromAddr = normalize(email.from.address);
  const toStr = normalize(email.to.map((t) => `${t.name} ${t.address}`).join(" "));
  const preview = normalize(email.preview);
  const body = normalize(stripHtml(email.body));

  for (const term of terms) {
    const t = normalize(term);
    if (!t) continue;

    let idx = matchTerm(subject, t);
    if (idx >= 0) {
      highlights.push({ field: "subject", start: idx, end: idx + t.length, term: t });
    }

    idx = matchTerm(fromName, t);
    if (idx >= 0) {
      highlights.push({ field: "from", start: idx, end: idx + t.length, term: t });
    } else {
      idx = matchTerm(fromAddr, t);
      if (idx >= 0) {
        highlights.push({ field: "from", start: idx, end: idx + t.length, term: t });
      }
    }

    idx = matchTerm(toStr, t);
    if (idx >= 0) {
      highlights.push({ field: "to", start: idx, end: idx + t.length, term: t });
    }

    idx = matchTerm(preview, t);
    if (idx >= 0) {
      highlights.push({ field: "preview", start: idx, end: idx + t.length, term: t });
    }

    idx = matchTerm(body, t);
    if (idx >= 0) {
      highlights.push({ field: "body", start: idx, end: idx + t.length, term: t });
    }

    for (const att of email.attachments) {
      idx = matchTerm(normalize(att.filename), t);
      if (idx >= 0) {
        highlights.push({ field: "filename", start: idx, end: idx + t.length, term: t });
      }
    }
  }

  return highlights;
}

/** Apply structured filters to a single email. Returns true if the email passes all filters. */
function applyFilters(email: Email, filters: SearchFilters): boolean {
  if (filters.from) {
    const f = normalize(filters.from);
    if (
      !matchTerm(normalize(email.from.name), f) &&
      !matchTerm(normalize(email.from.address), f)
    ) {
      return false;
    }
  }

  if (filters.to) {
    const t = normalize(filters.to);
    const allRecipients = [
      ...email.to,
      ...(email.cc ?? []),
      ...(email.bcc ?? []),
    ];
    const matches = allRecipients.some(
      (r) =>
        matchTerm(normalize(r.name), t) >= 0 ||
        matchTerm(normalize(r.address), t) >= 0,
    );
    if (!matches) return false;
  }

  if (filters.subject) {
    const s = normalize(filters.subject);
    if (matchTerm(normalize(email.subject), s) < 0) return false;
  }

  if (filters.hasAttachment !== undefined) {
    if (email.hasAttachments !== filters.hasAttachment) return false;
  }

  if (filters.before) {
    if (new Date(email.date).getTime() >= new Date(filters.before).getTime()) {
      return false;
    }
  }

  if (filters.after) {
    if (new Date(email.date).getTime() <= new Date(filters.after).getTime()) {
      return false;
    }
  }

  if (filters.isUnread !== undefined) {
    if (email.isRead !== !filters.isUnread) return false;
  }

  if (filters.isRead !== undefined) {
    if (email.isRead !== filters.isRead) return false;
  }

  if (filters.isStarred !== undefined) {
    if (email.isStarred !== filters.isStarred) return false;
  }

  if (filters.label) {
    const l = normalize(filters.label);
    const labelMatch = email.labels.some((lbl) => {
      // Match by label id (stripping "label-" prefix) or by name
      const id = normalize(lbl.replace(/^label-/, ""));
      return matchTerm(id, l) >= 0;
    });
    if (!labelMatch) return false;
  }

  if (filters.filename) {
    const fn = normalize(filters.filename);
    const hasFile = email.attachments.some((a) =>
      matchTerm(normalize(a.filename), fn) >= 0,
    );
    if (!hasFile) return false;
  }

  if (filters.larger !== undefined && filters.larger > 0) {
    if (email.size < filters.larger) return false;
  }

  if (filters.smaller !== undefined && filters.smaller > 0) {
    if (email.size > filters.smaller) return false;
  }

  return true;
}

/** Score an email for relevance ranking based on term matches. */
function scoreEmail(
  email: Email,
  terms: string[],
  highlights: MatchHighlight[],
): number {
  let score = 0;

  // Weight hits by field importance
  const fieldWeights: Record<string, number> = {
    subject: 10,
    from: 6,
    to: 4,
    preview: 3,
    body: 1,
    filename: 2,
  };

  for (const h of highlights) {
    score += fieldWeights[h.field] ?? 1;
  }

  // Bonus for subject exact match
  const subjectLower = normalize(email.subject);
  for (const term of terms) {
    const t = normalize(term);
    if (subjectLower.includes(t)) {
      score += 3;
      if (subjectLower.startsWith(t)) score += 2;
    }
  }

  // Bonus for unread
  if (!email.isRead) score += 1;
  // Bonus for starred
  if (email.isStarred) score += 1;

  // Recency bonus (newer = higher, decays over 30 days)
  const ageDays = (Date.now() - new Date(email.date).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 30) {
    score += (30 - ageDays) / 30;
  }

  return score;
}

/** Compute faceted counts from a list of emails. */
function computeFacets(emails: Email[]): SearchFacets {
  const facets: SearchFacets = {
    folders: {},
    labels: {},
    hasAttachment: 0,
    isUnread: 0,
    isStarred: 0,
    dateRanges: { today: 0, week: 0, month: 0, year: 0 },
  };

  const now = Date.now();
  const oneDay = 86400000;

  for (const email of emails) {
    facets.folders[email.folder] = (facets.folders[email.folder] ?? 0) + 1;

    for (const label of email.labels) {
      facets.labels[label] = (facets.labels[label] ?? 0) + 1;
    }

    if (email.hasAttachments) facets.hasAttachment++;
    if (!email.isRead) facets.isUnread++;
    if (email.isStarred) facets.isStarred++;

    const ageMs = now - new Date(email.date).getTime();
    if (ageMs < oneDay) facets.dateRanges.today++;
    if (ageMs < 7 * oneDay) facets.dateRanges.week++;
    if (ageMs < 30 * oneDay) facets.dateRanges.month++;
    if (ageMs < 365 * oneDay) facets.dateRanges.year++;
  }

  return facets;
}

/**
 * SearchIndex — builds a lightweight inverted index over a corpus of emails
 * and memoizes search results for repeated queries. Designed for 10k+ emails.
 */
export class SearchIndex {
  private emails: Email[];
  private index: Map<string, Set<string>>;
  private queryCache: Map<string, { results: SearchResult[]; facets: SearchFacets }>;
  private corpusTokens: Map<string, string>; // email.id → concatenated normalized text

  constructor(emails: Email[]) {
    this.emails = emails;
    this.index = new Map();
    this.queryCache = new Map();
    this.corpusTokens = new Map();
    this.buildIndex();
  }

  /** Build an inverted index: token → set of email IDs. */
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

  /** Extract all searchable tokens from an email. */
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
      ].join(" "),
    );
    return text.split(" ").filter((t) => t.length > 0);
  }

  /** Get the corpus text for an email (for full-text matching). */
  private getCorpus(emailId: string): string {
    return this.corpusTokens.get(emailId) ?? "";
  }

  /**
   * Search the index. Returns sorted results + facets.
   * Results are memoized by the raw query + sort mode.
   */
  search(query: string, sort: SearchSort = "relevance"): {
    results: SearchResult[];
    facets: SearchFacets;
  } {
    const cacheKey = `${query}::${sort}`;
    const cached = this.queryCache.get(cacheKey);
    if (cached) return cached;

    const parsed = parseSearchQuery(query);
    const terms = parsed.textTerms.map(normalize).filter((t) => t.length > 0);

    // Candidate set: if we have text terms, use the inverted index to narrow down;
    // otherwise, all emails pass the candidate stage and we rely on filters.
    let candidates: Email[];

    if (terms.length > 0) {
      const candidateIds = new Set<string>();
      for (const term of terms) {
        // Prefix-match tokens in the inverted index
        for (const [token, ids] of this.index) {
          if (token.includes(term) || term.includes(token)) {
          for (const id of ids) candidateIds.add(id);
          }
        }
        // Also fallback to scanning corpus (handles multi-word terms not in the token index)
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

    // Apply operator filters
    const filtered = candidates.filter((e) =>
      applyFilters(e, parsed.filters),
    );

    // Compute highlights and scores
    const results: SearchResult[] = filtered.map((email) => {
      const highlights = terms.length > 0
        ? collectHighlights(email, terms)
        : [];
      const score = scoreEmail(email, terms, highlights);
      return { email, score, highlights };
    });

    // Sort
    if (sort === "date") {
      results.sort(
        (a, b) =>
          new Date(b.email.date).getTime() - new Date(a.email.date).getTime(),
      );
    } else {
      // Relevance: score desc, then date desc as tiebreaker
      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (
          new Date(b.email.date).getTime() - new Date(a.email.date).getTime()
        );
      });
    }

    const facets = computeFacets(filtered);

    const result = { results, facets };
    this.queryCache.set(cacheKey, result);
    return result;
  }

  /** Invalidate the cache (e.g. when emails change). */
  invalidate(): void {
    this.queryCache.clear();
  }

  /** Rebuild the index with a new set of emails. */
  update(emails: Email[]): void {
    this.emails = emails;
    this.index.clear();
    this.queryCache.clear();
    this.corpusTokens.clear();
    this.buildIndex();
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor — a module-level search index shared across the app.
// ---------------------------------------------------------------------------

let globalIndex: SearchIndex | null = null;

/** Initialize or replace the global search index. */
export function initSearchIndex(emails: Email[]): SearchIndex {
  if (globalIndex) {
    globalIndex.update(emails);
  } else {
    globalIndex = new SearchIndex(emails);
  }
  return globalIndex;
}

/** Get the global search index, initializing it lazily if needed. */
export function getSearchIndex(): SearchIndex | null {
  return globalIndex;
}

/**
 * Convenience function: search using the global index.
 * Falls back to a one-shot search if the index isn't initialized.
 */
export function searchEmails(
  query: string,
  emails: Email[],
  sort: SearchSort = "relevance",
): { results: SearchResult[]; facets: SearchFacets } {
  if (globalIndex) {
    return globalIndex.search(query, sort);
  }
  // One-shot fallback
  const index = initSearchIndex(emails);
  return index.search(query, sort);
}

/**
 * Search with a pre-parsed SearchQuery (avoids re-parsing).
 */
export function searchParsed(
  parsed: SearchQuery,
  emails: Email[],
  sort: SearchSort = "relevance",
): { results: SearchResult[]; facets: SearchFacets } {
  const terms = parsed.textTerms.map(normalize).filter((t) => t.length > 0);
  const filtered = emails.filter((e) => applyFilters(e, parsed.filters));

  const results: SearchResult[] = filtered.map((email) => {
    const highlights = terms.length > 0
      ? collectHighlights(email, terms)
      : [];
    const score = scoreEmail(email, terms, highlights);
    return { email, score, highlights };
  });

  if (sort === "date") {
    results.sort(
      (a, b) =>
        new Date(b.email.date).getTime() - new Date(a.email.date).getTime(),
    );
  } else {
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.email.date).getTime() - new Date(a.email.date).getTime();
    });
  }

  return { results, facets: computeFacets(filtered) };
}
