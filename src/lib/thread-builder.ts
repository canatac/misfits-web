/**
 * Thread builder — groups flat email lists into conversation threads.
 *
 * Supports four threading strategies:
 *  - byReferences: RFC 5322 References / In-Reply-To header chains (union-find).
 *  - bySubject:   Normalised subject matching (strip Re:/Fwd: prefixes).
 *  - byParticipants: Same participant set.
 *  - smart:       References first, subject fallback for unmatched emails.
 *
 * Also provides detach / re-thread utilities.
 */
import type { Email, EmailAddress } from "@/types/email";
import type { Thread, ThreadingMode } from "@/types/thread";

/* ------------------------------------------------------------------ */
/* Subject normalisation                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function getParticipants(emails: Email[]): EmailAddress[] {
  const map = new Map<string, EmailAddress>();
  for (const e of emails) {
    if (!map.has(e.from.address)) map.set(e.from.address, e.from);
    for (const r of e.to) {
      if (!map.has(r.address)) map.set(r.address, r);
    }
    for (const r of e.cc ?? []) {
      if (!map.has(r.address)) map.set(r.address, r);
    }
  }
  return [...map.values()];
}

/** Build a Thread object from a list of emails (sorted chronologically). */
function buildThread(threadId: string, emails: Email[]): Thread {
  const sorted = [...emails].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  return {
    id: threadId,
    subject: stripSubjectPrefix(first.subject),
    messages: sorted,
    participants: getParticipants(sorted),
    lastMessageDate: last.date,
    firstMessageDate: first.date,
    unreadCount: sorted.filter((e) => !e.isRead).length,
    messageCount: sorted.length,
    hasAttachments: sorted.some((e) => e.hasAttachments),
    labels: [...new Set(sorted.flatMap((e) => e.labels))],
    folder: last.folder,
  };
}

/* ------------------------------------------------------------------ */
/* Union-Find for RFC 5322 threading                                 */
/* ------------------------------------------------------------------ */

type UF = Map<string, string>;

function ufFind(uf: UF, x: string): string {
  if (!uf.has(x)) uf.set(x, x);
  let root = x;
  while (uf.get(root) !== root) {
    root = uf.get(root)!;
  }
  // Path compression
  let curr = x;
  while (uf.get(curr) !== root) {
    const next = uf.get(curr)!;
    uf.set(curr, root);
    curr = next;
  }
  return root;
}

function ufUnion(uf: UF, a: string, b: string): void {
  const ra = ufFind(uf, a);
  const rb = ufFind(uf, b);
  if (ra !== rb) uf.set(ra, rb);
}

/* ------------------------------------------------------------------ */
/* Threading strategies                                               */
/* ------------------------------------------------------------------ */

/** Thread by RFC 5322 References / In-Reply-To headers. */
function threadByReferences(emails: Email[]): Thread[] {
  const uf: UF = new Map();

  // Initialise each email's Message-ID as its own group
  for (const e of emails) {
    if (e.messageId) ufFind(uf, e.messageId);
  }

  // Link via In-Reply-To and References
  for (const e of emails) {
    if (!e.messageId) continue;
    const refs = [
      ...(e.references ?? []),
      ...(e.inReplyTo ? [e.inReplyTo] : []),
    ];
    for (const ref of refs) {
      ufUnion(uf, e.messageId, ref);
    }
  }

  // Group emails by their root
  const groups = new Map<string, Email[]>();
  let singletonIdx = 0;
  for (const e of emails) {
    let key: string;
    if (e.messageId) {
      key = ufFind(uf, e.messageId);
    } else {
      key = `singleton-${singletonIdx++}`;
    }
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  let threadIdx = 0;
  return [...groups.values()].map((msgs) =>
    buildThread(msgs[0].threadId ?? `thread-refs-${threadIdx++}`, msgs),
  );
}

/** Thread by normalised subject (strip Re:/Fwd: prefixes). */
function threadBySubject(emails: Email[]): Thread[] {
  const groups = new Map<string, Email[]>();
  let singletonIdx = 0;
  for (const e of emails) {
    const key = normalizeSubject(e.subject) || `singleton-${singletonIdx++}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  let threadIdx = 0;
  return [...groups.values()].map((msgs) =>
    buildThread(msgs[0].threadId ?? `thread-subj-${threadIdx++}`, msgs),
  );
}

/** Thread by participant set (same sender + recipients). */
function threadByParticipants(emails: Email[]): Thread[] {
  const groups = new Map<string, Email[]>();
  for (const e of emails) {
    const key = [e.from, ...e.to, ...(e.cc ?? [])]
      .map((p) => p.address)
      .sort()
      .join("|");
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  let threadIdx = 0;
  return [...groups.values()].map((msgs) =>
    buildThread(msgs[0].threadId ?? `thread-part-${threadIdx++}`, msgs),
  );
}

/** Smart mode: References first, then subject fallback for unmatched. */
function threadSmart(emails: Email[]): Thread[] {
  // First pass: thread by references
  const refThreads = threadByReferences(emails);
  const threaded = new Set<string>();
  for (const t of refThreads) {
    for (const e of t.messages) threaded.add(e.id);
  }

  // Second pass: group unthreaded emails by subject
  const unthreaded = emails.filter((e) => !threaded.has(e.id));
  const subjThreads = unthreaded.length > 0 ? threadBySubject(unthreaded) : [];

  // Merge: merge threads that share a normalised subject (ref + subj overlap)
  const merged = new Map<string, Thread>();
  for (const t of refThreads) {
    merged.set(t.id, t);
  }
  for (const st of subjThreads) {
    const normSubj = normalizeSubject(st.subject);
    // Check if any existing ref thread has the same normalised subject
    let found = false;
    for (const [, t] of merged) {
      if (normalizeSubject(t.subject) === normSubj) {
        // Merge messages into the existing thread
        const combined = [...t.messages, ...st.messages];
        merged.set(t.id, buildThread(t.id, combined));
        found = true;
        break;
      }
    }
    if (!found) {
      merged.set(st.id, st);
    }
  }

  return [...merged.values()];
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/** Group emails into threads using the specified strategy. */
export function buildThreads(
  emails: Email[],
  mode: ThreadingMode = "smart",
): Thread[] {
  if (emails.length === 0) return [];
  switch (mode) {
    case "byReferences":
      return threadByReferences(emails);
    case "bySubject":
      return threadBySubject(emails);
    case "byParticipants":
      return threadByParticipants(emails);
    case "smart":
    default:
      return threadSmart(emails);
  }
}

/** Remove an email from all threads and place it in its own singleton thread. */
export function detachEmail(email: Email, threads: Thread[]): Thread[] {
  const updated = threads
    .map((t) => ({ ...t, messages: t.messages.filter((m) => m.id !== email.id) }))
    .filter((t) => t.messages.length > 0);

  updated.push(buildThread(`thread-detached-${email.id}`, [email]));
  return updated;
}

/** Move an email from its current thread to a different (or new) thread. */
export function rethreadEmail(
  email: Email,
  targetThreadId: string,
  threads: Thread[],
): Thread[] {
  // Remove from all existing threads
  const updated = threads
    .map((t) => ({ ...t, messages: t.messages.filter((m) => m.id !== email.id) }))
    .filter((t) => t.messages.length > 0);

  const target = updated.find((t) => t.id === targetThreadId);
  if (target) {
    target.messages = [...target.messages, email];
    // Rebuild the target thread's metadata
    return updated.map((t) =>
      t.id === targetThreadId ? buildThread(t.id, t.messages) : t,
    );
  }

  // Target doesn't exist yet — create a new thread
  updated.push(buildThread(targetThreadId, [email]));
  return updated;
}
