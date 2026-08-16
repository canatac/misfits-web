/**
 * Subject normalisation helpers used by the thread builder & strategies.
 * Kept as a leaf module (no dependencies) so both `thread-builder.ts` and
 * `thread-strategies.ts` can import without creating a cycle.
 */

const SUBJECT_PREFIX_RE = /^(re|fwd|fw|aw|wg):\s*/i;

/** Remove all leading Re:/Fwd:/Aw:/Wg: prefixes (handles nested Re: Re: Re:). */
export function stripSubjectPrefix(subject: string): string {
  let stripped = subject.trim();
  let prev: string;
  do {
    prev = stripped;
    stripped = stripped.replace(SUBJECT_PREFIX_RE, "").trim();
  } while (stripped !== prev);
  return stripped;
}

/** Normalised subject for matching: lowercase, prefix-stripped, trimmed. */
export function normalizeSubject(subject: string): string {
  return stripSubjectPrefix(subject).toLowerCase().trim();
}
