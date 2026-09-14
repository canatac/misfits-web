/**
 * email-find-in-page.ts — find-in-page highlighter for email body content.
 *
 * Searches rendered email DOM text and highlights matches, supports
 * next/prev navigation and result count reporting.
 */

export interface FindMatch {
  text: string;
  index: number;
  length: number;
}

export interface FindResult {
  matches: FindMatch[];
  total: number;
  currentIndex: number;
}

export interface FindOptions {
  caseSensitive?: boolean;
}

export function findAllInText(text: string, query: string, opts: FindOptions = {}): FindMatch[] {
  if (!query) return [];
  const matches: FindMatch[] = [];
  const flags = opts.caseSensitive ? "g" : "gi";
  const re = new RegExp(escapeRegExp(query), flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push({ text: m[0], index: m.index, length: m[0].length });
  }
  return matches;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class FindInPage {
  private matches: FindMatch[] = [];
  private current = -1;

  search(text: string, query: string, opts: FindOptions = {}): FindResult {
    this.matches = findAllInText(text, query, opts);
    this.current = this.matches.length > 0 ? 0 : -1;
    return this.result();
  }

  next(): FindResult {
    if (!this.matches.length) return this.result();
    this.current = (this.current + 1) % this.matches.length;
    return this.result();
  }

  prev(): FindResult {
    if (!this.matches.length) return this.result();
    this.current = (this.current - 1 + this.matches.length) % this.matches.length;
    return this.result();
  }

  clear(): void {
    this.matches = [];
    this.current = -1;
  }

  private result(): FindResult {
    return {
      matches: this.matches,
      total: this.matches.length,
      currentIndex: this.current,
    };
  }
}
