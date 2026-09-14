/**
 * Search result highlighting (Issue #465).
 *
 * Highlights matched terms in search results with <mark> elements
 * using brand color at 30% opacity.
 */

const BRAND_MARK_CLASSES = "bg-[#C49B66]/30 rounded-sm px-0.5";

/**
 * Escapes HTML special characters to prevent XSS when injecting highlighted HTML.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Highlights all occurrences of query terms in the given text.
 * Returns an HTML string with matched terms wrapped in <mark> elements.
 *
 * @param text The source text to search within
 * @param query The search query (space-separated terms)
 * @returns HTML string with <mark>-wrapped matches
 */
export function highlightTerms(text: string, query: string): string {
  const escaped = escapeHtml(text);
  const terms = query
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (terms.length === 0) return escaped;

  // Escape regex special chars in terms
  const escapedTerms = terms.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  // Remove duplicates and sort by length (desc) for greedy matching
  const uniqueTerms = [...new Set(escapedTerms)].sort(
    (a, b) => b.length - a.length
  );

  if (uniqueTerms.length === 0) return escaped;

  const pattern = new RegExp(`(${uniqueTerms.join("|")})`, "gi");

  return escaped.replace(pattern, `<mark class="${BRAND_MARK_CLASSES}">$1</mark>`);
}

/**
 * Returns the CSS class string for highlighted search marks.
 */
export function getHighlightClasses(): string {
  return BRAND_MARK_CLASSES;
}

/**
 * Splits text into segments: { text, highlighted: boolean }[]
 * Useful for React rendering without dangerouslySetInnerHTML.
 */
export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

export function splitHighlightedSegments(
  text: string,
  query: string
): HighlightSegment[] {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return [{ text, highlighted: false }];
  }

  const escapedTerms = terms.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const uniqueTerms = [...new Set(escapedTerms)].sort(
    (a, b) => b.length - a.length
  );

  const pattern = new RegExp(`(${uniqueTerms.join("|")})`, "gi");
  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        highlighted: false,
      });
    }
    segments.push({ text: match[0], highlighted: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return segments;
}
