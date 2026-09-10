/**
 * Search result highlighting (Issue #465).
 *
 * Highlights matched search terms in email search results
 * with brand-color background and case-insensitive matching.
 */

export interface HighlightConfig {
  brandColor: string;
  opacity: number;
  tagName: string;
}

export const DEFAULT_CONFIG: HighlightConfig = {
  brandColor: "#C49B66",
  opacity: 0.3,
  tagName: "mark",
};

/**
 * Escape special regex characters in search term.
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split text into parts: matched and unmatched.
 */
export function splitByMatches(text: string, searchTerm: string): Array<{ text: string; matched: boolean }> {
  if (!searchTerm.trim()) {
    return [{ text, matched: false }];
  }

  const escaped = escapeRegExp(searchTerm);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part) => ({
    text: part,
    matched: regex.test(part),
  }));
}

/**
 * Highlight matched terms in text.
 */
export function highlightText(text: string, searchTerm: string, config: HighlightConfig = DEFAULT_CONFIG): string {
  if (!searchTerm.trim() || !text) return text;

  const escaped = escapeRegExp(searchTerm);
  const regex = new RegExp(`(${escaped})`, "gi");
  const bgColor = `${config.brandColor}${Math.round(config.opacity * 255).toString(16).padStart(2, "0")}`;

  return text.replace(regex, `<${config.tagName} style="background-color: ${bgColor};">${"$1"}</${config.tagName}>`);
}

/**
 * Highlight multiple search terms in text.
 */
export function highlightMultipleTerms(text: string, searchTerms: string[], config: HighlightConfig = DEFAULT_CONFIG): string {
  if (!searchTerms.length || !text) return text;

  const terms = searchTerms.filter((t) => t.trim()).map(escapeRegExp);
  if (!terms.length) return text;

  const regex = new RegExp(`(${terms.join("|")})`, "gi");
  const bgColor = `${config.brandColor}${Math.round(config.opacity * 255).toString(16).padStart(2, "0")}`;

  return text.replace(regex, `<${config.tagName} style="background-color: ${bgColor};">${"$1"}</${config.tagName}>`);
}

/**
 * Check if text contains search term (case-insensitive).
 */
export function containsSearchTerm(text: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return false;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * Count matches in text.
 */
export function countMatches(text: string, searchTerm: string): number {
  if (!searchTerm.trim()) return 0;
  const escaped = escapeRegExp(searchTerm);
  const regex = new RegExp(escaped, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Get all unique search terms from query.
 */
export function parseSearchTerms(query: string): string[] {
  return query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
