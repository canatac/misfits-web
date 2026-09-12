/**
 * Reading time estimation (Issue #442).
 */

export interface ReadingTimeResult {
  minutes: number;
  words: number;
  label: string;
  isLongRead: boolean;
}

export interface ReadingTimeOptions {
  wpm?: number;
  minWordsForDisplay?: number;
  longReadThreshold?: number;
}

export const DEFAULT_READING_OPTIONS: ReadingTimeOptions = {
  wpm: 200,
  minWordsForDisplay: 20,
  longReadThreshold: 5,
};

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function calculateReadingTime(wordCount: number, options: ReadingTimeOptions = {}): ReadingTimeResult {
  const wpm = options.wpm ?? DEFAULT_READING_OPTIONS.wpm ?? 200;
  const longThreshold = options.longReadThreshold ?? DEFAULT_READING_OPTIONS.longReadThreshold ?? 5;
  const minutes = Math.max(1, Math.ceil(wordCount / wpm));
  const isLongRead = minutes >= longThreshold;
  let label: string;
  if (minutes < 1) label = "< 1 min read";
  else if (minutes === 1) label = "1 min read";
  else if (minutes < longThreshold) label = `${minutes} min read`;
  else label = `${minutes} min read • Long read`;
  return { minutes, words: wordCount, label, isLongRead };
}

export function getReadingTimeFromHtml(html: string, options: ReadingTimeOptions = {}): ReadingTimeResult | null {
  const text = stripHtml(html);
  const words = countWords(text);
  const minWords = options.minWordsForDisplay ?? DEFAULT_READING_OPTIONS.minWordsForDisplay ?? 20;
  if (words < minWords) return null;
  return calculateReadingTime(words, options);
}

export function getReadingTimeFromText(text: string, options: ReadingTimeOptions = {}): ReadingTimeResult | null {
  const words = countWords(text);
  const minWords = options.minWordsForDisplay ?? DEFAULT_READING_OPTIONS.minWordsForDisplay ?? 20;
  if (words < minWords) return null;
  return calculateReadingTime(words, options);
}
