/**
 * Estimated reading time (Issue #442).
 *
 * Shows estimated reading time for emails based on word count.
 * 200 words per minute standard. HTML stripped before counting.
 */

export interface ReadingTimeConfig {
  wordsPerMinute: number;
  shortThreshold: number; // words below this show nothing
  longThreshold: number; // words above this show "Long read"
}

export const DEFAULT_CONFIG: ReadingTimeConfig = {
  wordsPerMinute: 200,
  shortThreshold: 20,
  longThreshold: 200,
};

/**
 * Strip HTML tags from text.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Count words in text.
 */
export function countWords(text: string): number {
  const stripped = stripHtml(text);
  const words = stripped.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * Calculate reading time in minutes.
 */
export function calculateReadingTime(text: string, config: ReadingTimeConfig = DEFAULT_CONFIG): number {
  const wordCount = countWords(text);
  return Math.ceil(wordCount / config.wordsPerMinute);
}

/**
 * Get reading time label.
 */
export function getReadingTimeLabel(text: string, config: ReadingTimeConfig = DEFAULT_CONFIG): string {
  const wordCount = countWords(text);

  if (wordCount < config.shortThreshold) return "";
  if (wordCount > config.longThreshold) return "Long read";

  const minutes = calculateReadingTime(text, config);
  if (minutes <= 1) return "~1 min read";
  return `~${minutes} min read`;
}

/**
 * Check if reading time should be shown.
 */
export function shouldShowReadingTime(text: string, config: ReadingTimeConfig = DEFAULT_CONFIG): boolean {
  return countWords(text) >= config.shortThreshold;
}

/**
 * Get word count.
 */
export function getWordCount(text: string): number {
  return countWords(text);
}
