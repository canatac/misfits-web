/**
 * Text utilities partagées par le moteur de recherche :
 * normalisation, strip HTML, distance de Levenshtein bornée et
 * matcher fuzzy pour termes courts.
 */

/** Strip HTML tags from a body string for text matching. */
export function stripHtml(html: string): string {
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
export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Levenshtein distance (bounded) for short fuzzy matching. */
export function levenshtein(a: string, b: string, maxDist: number): number {
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
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
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
export function matchTerm(text: string, term: string): number {
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
