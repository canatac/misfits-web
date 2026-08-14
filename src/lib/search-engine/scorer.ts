/**
 * Scorer : ranking par pertinence (poids par champ, bonus subject/unread/starred,
 * décroissance de récence) et calcul des facettes agrégées.
 */
import type { Email } from "@/types/email";
import type { MatchHighlight, SearchFacets } from "@/types/search";
import { normalize } from "./text-utils";

/** Score an email for relevance ranking based on term matches. */
export function scoreEmail(
  email: Email,
  terms: string[],
  highlights: MatchHighlight[]
): number {
  let score = 0;

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

  const subjectLower = normalize(email.subject);
  for (const term of terms) {
    const t = normalize(term);
    if (subjectLower.includes(t)) {
      score += 3;
      if (subjectLower.startsWith(t)) score += 2;
    }
  }

  if (!email.isRead) score += 1;
  if (email.isStarred) score += 1;

  const ageDays =
    (Date.now() - new Date(email.date).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 30) {
    score += (30 - ageDays) / 30;
  }

  return score;
}

/** Compute faceted counts from a list of emails. */
export function computeFacets(emails: Email[]): SearchFacets {
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
