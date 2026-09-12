/**
 * email-digest.ts — email digest aggregation helpers.
 *
 * Collects new/unread messages since last digest run and groups them into
 * a concise summary grouped by sender + topic for the daily digest UI.
 */

export interface DigestMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: number;
  threadId: string;
}

export interface DigestGroup {
  key: string;
  from: string;
  messages: DigestMessage[];
  latestAt: number;
}

export interface DigestResult {
  generatedAt: number;
  total: number;
  groups: DigestGroup[];
}

/**
 * Group messages by sender (from). Messages from the same sender with the
 * same subject (after normalization) are merged into one group.
 */
export function groupMessages(messages: DigestMessage[]): DigestGroup[] {
  const map = new Map<string, DigestGroup>();
  for (const m of messages) {
    const key = `${m.from}|${normalizeSubject(m.subject)}`;
    const existing = map.get(key);
    if (existing) {
      existing.messages.push(m);
      existing.latestAt = Math.max(existing.latestAt, m.receivedAt);
    } else {
      map.set(key, {
        key,
        from: m.from,
        messages: [m],
        latestAt: m.receivedAt,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.latestAt - a.latestAt);
}

/** Strip Re:/Fwd:/whitespace noise from a subject for grouping. */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw)\s*:\s*/gi, "")
    .trim()
    .toLowerCase();
}

/** Build a digest from raw messages; groups, sorts, and stamps metadata. */
export function buildDigest(messages: DigestMessage[]): DigestResult {
  const groups = groupMessages(messages);
  return {
    generatedAt: Date.now(),
    total: messages.length,
    groups,
  };
}
