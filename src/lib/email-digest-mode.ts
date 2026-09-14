// email-digest-mode.ts — digest-mode batching of email groups for quick triage.

export type DigestStrategy = "sender" | "domain" | "subject-prefix";

export interface DigestEmail {
  id: string;
  from: { name?: string; address: string };
  subject: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  size: number;
}

export interface DigestDigest {
  key: string;
  displayName: string;
  count: number;
  totalSize: number;
  latestDate: string;
  unreadCount: number;
  starredCount: number;
  emailIds: string[];
}

/**
 * Extract a grouping key for a digest strategy.
 */
export function extractDigestKey(strategy: DigestStrategy, email: DigestEmail): string {
  switch (strategy) {
    case "sender":
      return email.from.address.toLowerCase();
    case "domain":
      return email.from.address.split("@")[1]?.toLowerCase() ?? "unknown";
    case "subject-prefix":
      return extractSubjectPrefix(email.subject);
    default:
      return "other";
  }
}

/**
 * Extract the subject prefix before any separators ("Re:", "Fwd:", " — ", ": ").
 */
export function extractSubjectPrefix(subject: string): string {
  let cleaned = subject.trim();
  // Strip Re:/Fwd: prefixes (case-insensitive, any number)
  const prefixPattern = /^(re|fwd|fw)\s*:\s*/i;
  while (prefixPattern.test(cleaned)) {
    cleaned = cleaned.replace(prefixPattern, "").trim();
  }
  // Take everything up to the first " — " or " : "
  const sep = cleaned.search(/\s[—:]\s/);
  if (sep > 0) return cleaned.slice(0, sep).trim();
  return cleaned;
}

/**
 * Human-readable display name for a digest group.
 */
export function digestDisplayName(strategy: DigestStrategy, key: string): string {
  switch (strategy) {
    case "sender":
      return key;
    case "domain":
      return key;
    case "subject-prefix":
      return key || "(no subject)";
    default:
      return key;
  }
}

/**
 * Group emails into digest buckets using the given strategy.
 */
export function buildDigests(
  strategy: DigestStrategy,
  emails: DigestEmail[]
): DigestDigest[] {
  const map = new Map<string, DigestDigest>();

  for (const email of emails) {
    const key = extractDigestKey(strategy, email);
    const displayName = digestDisplayName(strategy, key);
    let bucket = map.get(key);
    if (!bucket) {
      bucket = {
        key,
        displayName,
        count: 0,
        totalSize: 0,
        latestDate: email.date,
        unreadCount: 0,
        starredCount: 0,
        emailIds: [],
      };
      map.set(key, bucket);
    }
    bucket.count += 1;
    bucket.totalSize += email.size ?? 0;
    if (!email.isRead) bucket.unreadCount += 1;
    if (email.isStarred) bucket.starredCount += 1;
    if (new Date(email.date).getTime() > new Date(bucket.latestDate).getTime()) {
      bucket.latestDate = email.date;
    }
    bucket.emailIds.push(email.id);
  }

  // Sort by most recent activity first, then by count desc
  return [...map.values()].sort((a, b) => {
    const dateDiff = new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.count - a.count;
  });
}

/**
 * Expand a single digest back into sorted email ids.
 */
export function expandDigest(digest: DigestDigest): string[] {
  return [...digest.emailIds];
}

/**
 * Flatten all digests into a list of grouped email id lists.
 */
export function flattenDigests(digests: DigestDigest[]): string[][] {
  return digests.map(expandDigest);
}

/**
 * Get a summary of digest mode statistics.
 */
export function digestStats(digests: DigestDigest[]): {
  totalGroups: number;
  totalEmails: number;
  totalUnread: number;
} {
  return {
    totalGroups: digests.length,
    totalEmails: digests.reduce((sum, d) => sum + d.count, 0),
    totalUnread: digests.reduce((sum, d) => sum + d.unreadCount, 0),
  };
}
