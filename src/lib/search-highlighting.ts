/**
 * search-highlighting.ts — search result highlight helpers.
 *
 * Given a query string and a target text, returns highlight ranges that the
 * UI can wrap in <mark> tags. Case-insensitive, supports multi-token AND.
 */

export interface HighlightRange {
  start: number;
  end: number;
}

export interface HighlightResult {
  text: string;
  ranges: HighlightRange[];
  matchCount: number;
}

/**
 * Escape a string for safe use inside a RegExp.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compute highlight ranges for `query` inside `text`.
 * Splits query on whitespace; each token must be present (AND semantics).
 */
export function computeHighlights(query: string, text: string): HighlightResult {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return { text, ranges: [], matchCount: 0 };

  const ranges: HighlightRange[] = [];
  let matchCount = 0;

  for (const token of tokens) {
    const re = new RegExp(escapeRegExp(token), "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
      matchCount++;
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  return { text, ranges, matchCount };
}

/**
 * Wrap highlight ranges in <mark> tags. Ranges must be non-overlapping and sorted.
 */
export function applyHighlights(text: string, ranges: HighlightRange[]): string {
  if (!ranges.length) return text;
  let out = "";
  let cursor = 0;
  for (const r of ranges) {
    out += escapeHtml(text.slice(cursor, r.start));
    out += `<mark>${escapeHtml(text.slice(r.start, r.end))}</mark>`;
    cursor = r.end;
  }
  out += escapeHtml(text.slice(cursor));
  return out;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
