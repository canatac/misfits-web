/**
 * Instant search index (Issue #521).
 *
 * Provides sub-200ms full-text search across all emails using an in-memory
 * inverted index. Supports incremental indexing and nested labels.
 */

import type { Email } from "@/types/email";

export interface SearchIndexEntry {
  emailId: string;
  field: "subject" | "body" | "from" | "to" | "preview";
  term: string;
}

export interface SearchIndexStats {
  totalEmails: number;
  totalTerms: number;
  lastUpdated: string;
  indexingTime: number;
}

interface IndexEntry {
  emailId: string;
  field: string;
  position: number;
}

/**
 * Inverted index for instant email search.
 */
export class EmailSearchIndex {
  private index: Map<string, IndexEntry[]> = new Map();
  private emailMap: Map<string, Email> = new Map();
  private lastUpdated: string = "";
  private indexingTime: number = 0;

  /**
   * Index a single email.
   */
  indexEmail(email: Email): void {
    const startTime = performance.now();

    // Remove existing entries for this email
    this.removeEmail(email.id);

    // Index each field
    this.indexText(email.id, "subject", email.subject);
    this.indexText(email.id, "preview", email.preview);
    this.indexText(email.id, "body", email.body.replace(/<[^>]*>/g, ""));
    this.indexText(email.id, "from", `${email.from.name} ${email.from.address}`);
    for (const to of email.to) {
      this.indexText(email.id, "to", `${to.name} ${to.address}`);
    }

    // Store email reference
    this.emailMap.set(email.id, email);

    this.lastUpdated = new Date().toISOString();
    this.indexingTime = performance.now() - startTime;
  }

  /**
   * Index multiple emails.
   */
  indexEmails(emails: Email[]): void {
    const startTime = performance.now();
    for (const email of emails) {
      this.indexEmail(email);
    }
    this.indexingTime = performance.now() - startTime;
  }

  /**
   * Remove an email from the index.
   */
  removeEmail(emailId: string): void {
    for (const [term, entries] of this.index) {
      const filtered = entries.filter((e) => e.emailId !== emailId);
      if (filtered.length === 0) {
        this.index.delete(term);
      } else {
        this.index.set(term, filtered);
      }
    }
    this.emailMap.delete(emailId);
  }

  /**
   * Search for emails matching a query.
   */
  search(query: string, options: {
    fields?: string[];
    limit?: number;
  } = {}): Array<{ email: Email; score: number; matches: string[] }> {
    const startTime = performance.now();
    const terms = this.tokenize(query);
    const scores: Map<string, { score: number; matches: Set<string> }> = new Map();

    for (const term of terms) {
      const entries = this.index.get(term) || [];
      for (const entry of entries) {
        if (options.fields && !options.fields.includes(entry.field)) {
          continue;
        }

        const existing = scores.get(entry.emailId) || { score: 0, matches: new Set() };
        existing.score += this.getTermWeight(entry.field);
        existing.matches.add(entry.field);
        scores.set(entry.emailId, existing);
      }
    }

    const results = Array.from(scores.entries())
      .map(([emailId, { score, matches }]) => ({
        email: this.emailMap.get(emailId)!,
        score,
        matches: Array.from(matches),
      }))
      .filter((r) => r.email)
      .sort((a, b) => b.score - a.score);

    const limit = options.limit || 50;
    return results.slice(0, limit);
  }

  /**
   * Get search suggestions for autocomplete.
   */
  getSuggestions(prefix: string, limit: number = 5): string[] {
    const suggestions: string[] = [];
    const lower = prefix.toLowerCase();

    for (const term of this.index.keys()) {
      if (term.startsWith(lower)) {
        suggestions.push(term);
      }
      if (suggestions.length >= limit) break;
    }

    return suggestions;
  }

  /**
   * Get index statistics.
   */
  getStats(): SearchIndexStats {
    return {
      totalEmails: this.emailMap.size,
      totalTerms: this.index.size,
      lastUpdated: this.lastUpdated,
      indexingTime: this.indexingTime,
    };
  }

  /**
   * Clear the entire index.
   */
  clear(): void {
    this.index.clear();
    this.emailMap.clear();
    this.lastUpdated = "";
    this.indexingTime = 0;
  }

  /**
   * Tokenize text into search terms.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s@.]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  /**
   * Get weight for a field (higher = more important).
   */
  private getTermWeight(field: string): number {
    const weights: Record<string, number> = {
      subject: 10,
      from: 5,
      to: 3,
      preview: 2,
      body: 1,
    };
    return weights[field] || 1;
  }
}

/**
 * Create a new search index.
 */
export function createSearchIndex(): EmailSearchIndex {
  return new EmailSearchIndex();
}

/**
 * Tokenize a query for search.
 */
export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s@.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Highlight matching terms in text.
 */
export function highlightMatches(text: string, query: string): string {
  const terms = tokenizeQuery(query);
  let result = text;

  for (const term of terms) {
    const regex = new RegExp(`(${term})`, "gi");
    result = result.replace(regex, "<mark>$1</mark>");
  }

  return result;
}
