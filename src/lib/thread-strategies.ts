/**
 * Threading strategies used by `thread-builder.ts`.
 * Extracted so the public builder API stays small and each strategy can be
 * unit-tested in isolation.
 */
import type { Email } from "@/types/email";
import type { Thread } from "@/types/thread";
import { normalizeSubject } from "@/lib/thread-subject";

/* ------------------------------------------------------------------ */
/* Union-Find for RFC 5322 threading                                  */
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
export function threadByReferences(
  emails: Email[],
  buildThread: (threadId: string, emails: Email[]) => Thread
): Thread[] {
  const uf: UF = new Map();

  for (const e of emails) {
    if (e.messageId) ufFind(uf, e.messageId);
  }

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
    buildThread(msgs[0].threadId ?? `thread-refs-${threadIdx++}`, msgs)
  );
}

/** Thread by normalised subject (strip Re:/Fwd: prefixes). */
export function threadBySubject(
  emails: Email[],
  buildThread: (threadId: string, emails: Email[]) => Thread
): Thread[] {
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
    buildThread(msgs[0].threadId ?? `thread-subj-${threadIdx++}`, msgs)
  );
}

/** Thread by participant set (same sender + recipients). */
export function threadByParticipants(
  emails: Email[],
  buildThread: (threadId: string, emails: Email[]) => Thread
): Thread[] {
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
    buildThread(msgs[0].threadId ?? `thread-part-${threadIdx++}`, msgs)
  );
}

/** Smart mode: References first, then subject fallback for unmatched. */
export function threadSmart(
  emails: Email[],
  buildThread: (threadId: string, emails: Email[]) => Thread
): Thread[] {
  const refThreads = threadByReferences(emails, buildThread);
  const threaded = new Set<string>();
  for (const t of refThreads) {
    for (const e of t.messages) threaded.add(e.id);
  }

  const unthreaded = emails.filter((e) => !threaded.has(e.id));
  const subjThreads =
    unthreaded.length > 0 ? threadBySubject(unthreaded, buildThread) : [];

  const merged = new Map<string, Thread>();
  for (const t of refThreads) {
    merged.set(t.id, t);
  }
  for (const st of subjThreads) {
    const normSubj = normalizeSubject(st.subject);
    let found = false;
    for (const [, t] of merged) {
      if (normalizeSubject(t.subject) === normSubj) {
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
