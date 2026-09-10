/**
 * Newsletter AI Summary (Issue #485).
 *
 * Detects newsletter emails (via List-Unsubscribe header) and provides
 * AI-powered summaries with key points, links, and reading time estimates.
 */

export interface NewsletterSummary {
  emailId: string;
  keyPoints: string[];
  notableLinks: Array<{ url: string; text: string }>;
  estimatedReadingTime: number; // minutes
  summary: string;
  generatedAt: string;
  cached: boolean;
}

export interface NewsletterDetection {
  isNewsletter: boolean;
  confidence: number;
  listId?: string;
  unsubscribeUrl?: string;
}

/**
 * Detect if an email is a newsletter.
 */
export function detectNewsletter(headers: Record<string, string>): NewsletterDetection {
  const listUnsubscribe = headers["list-unsubscribe"] || headers["List-Unsubscribe"];
  const listId = headers["list-id"] || headers["List-Id"];
  const precedence = headers["precedence"] || headers["Precedence"];
  const xMailingList = headers["x-mailing-list"] || headers["X-Mailing-List"];

  const isNewsletter = !!(
    listUnsubscribe ||
    listId ||
    precedence === "bulk" ||
    xMailingList
  );

  let confidence = 0;
  if (listUnsubscribe) confidence += 0.4;
  if (listId) confidence += 0.3;
  if (precedence === "bulk") confidence += 0.2;
  if (xMailingList) confidence += 0.1;

  return {
    isNewsletter,
    confidence: Math.min(confidence, 1),
    listId: listId,
    unsubscribeUrl: listUnsubscribe,
  };
}

/**
 * Check if an email is a newsletter.
 */
export function isNewsletterEmail(headers: Record<string, string>): boolean {
  return detectNewsletter(headers).isNewsletter;
}

/**
 * Generate a newsletter summary (placeholder for AI integration).
 */
export function generateNewsletterSummary(
  emailId: string,
  subject: string,
  body: string
): NewsletterSummary {
  // Extract key points (sentences with important keywords)
  const sentences = body
    .replace(/<[^>]*>/g, "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 200);

  const keyPoints = sentences.slice(0, 5);

  // Extract notable links
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
  const notableLinks: Array<{ url: string; text: string }> = [];
  let match;

  while ((match = linkRegex.exec(body)) !== null) {
    notableLinks.push({
      url: match[1],
      text: match[2].trim() || match[1],
    });
  }

  // Estimate reading time (average 200 words per minute)
  const wordCount = body.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    emailId,
    keyPoints,
    notableLinks: notableLinks.slice(0, 10),
    estimatedReadingTime,
    summary: keyPoints.join(". ") + ".",
    generatedAt: new Date().toISOString(),
    cached: false,
  };
}

/**
 * Cache a newsletter summary.
 */
export function cacheSummary(
  summaries: Map<string, NewsletterSummary>,
  summary: NewsletterSummary
): Map<string, NewsletterSummary> {
  const newCache = new Map(summaries);
  newCache.set(summary.emailId, { ...summary, cached: true });
  return newCache;
}

/**
 * Get cached summary for an email.
 */
export function getCachedSummary(
  summaries: Map<string, NewsletterSummary>,
  emailId: string
): NewsletterSummary | undefined {
  return summaries.get(emailId);
}

/**
 * Check if summary is cached.
 */
export function hasCachedSummary(
  summaries: Map<string, NewsletterSummary>,
  emailId: string
): boolean {
  return summaries.has(emailId);
}

/**
 * Clear cached summaries.
 */
export function clearSummaryCache(): Map<string, NewsletterSummary> {
  return new Map();
}

/**
 * Get cache size.
 */
export function getCacheSize(summaries: Map<string, NewsletterSummary>): number {
  return summaries.size;
}

/**
 * Format reading time for display.
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return "Less than 1 min";
  if (minutes === 1) return "1 min read";
  return `${minutes} min read`;
}

/**
 * Get newsletter badge text.
 */
export function getNewsletterBadgeText(detection: NewsletterDetection): string {
  if (!detection.isNewsletter) return "";
  if (detection.confidence >= 0.7) return "Newsletter";
  if (detection.confidence >= 0.4) return "Likely newsletter";
  return "Bulk email";
}

/**
 * Extract unsubscribe URL from headers.
 */
export function extractUnsubscribeUrl(headers: Record<string, string>): string | undefined {
  const listUnsubscribe = headers["list-unsubscribe"] || headers["List-Unsubscribe"];
  if (!listUnsubscribe) return undefined;

  const match = listUnsubscribe.match(/<([^>]+)>/);
  return match ? match[1] : listUnsubscribe;
}

/**
 * Check if batch summary is available (multiple newsletters).
 */
export function canBatchSummarize(emailIds: string[], summaries: Map<string, NewsletterSummary>): boolean {
  return emailIds.length > 1;
}

/**
 * Generate batch summary for multiple newsletters.
 */
export function generateBatchSummary(
  emailIds: string[],
  summaries: Map<string, NewsletterSummary>
): {
  totalEmails: number;
  totalReadingTime: number;
  allKeyPoints: string[];
  generatedAt: string;
} {
  const existingSummaries = emailIds
    .map((id) => summaries.get(id))
    .filter((s): s is NewsletterSummary => s !== undefined);

  const allKeyPoints = existingSummaries.flatMap((s) => s.keyPoints);
  const totalReadingTime = existingSummaries.reduce((sum, s) => sum + s.estimatedReadingTime, 0);

  return {
    totalEmails: existingSummaries.length,
    totalReadingTime,
    allKeyPoints: allKeyPoints.slice(0, 20),
    generatedAt: new Date().toISOString(),
  };
}
