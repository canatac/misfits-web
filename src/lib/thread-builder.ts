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
 *
 * Strategies live in `./thread-strategies.ts`; subject normalisation lives in
 * `./thread-subject.ts`. This module owns the public API + Thread assembly.
 */
import type { Email, EmailAddress } from "@/types/email";
import type { Thread, ThreadingMode } from "@/types/thread";
import {
  threadByReferences,
  threadBySubject,
  threadByParticipants,
  threadSmart,
} from "@/lib/thread-strategies";
import { stripSubjectPrefix } from "@/lib/thread-subject";

export { stripSubjectPrefix, normalizeSubject } from "@/lib/thread-subject";

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
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/** Group emails into threads using the specified strategy. */
export function buildThreads(
  emails: Email[],
  mode: ThreadingMode = "smart"
): Thread[] {
  if (emails.length === 0) return [];
  switch (mode) {
    case "byReferences":
      return threadByReferences(emails, buildThread);
    case "bySubject":
      return threadBySubject(emails, buildThread);
    case "byParticipants":
      return threadByParticipants(emails, buildThread);
    case "smart":
    default:
      return threadSmart(emails, buildThread);
  }
}

/** Remove an email from all threads and place it in its own singleton thread. */
export function detachEmail(email: Email, threads: Thread[]): Thread[] {
  const updated = threads
    .map((t) => ({
      ...t,
      messages: t.messages.filter((m) => m.id !== email.id),
    }))
    .filter((t) => t.messages.length > 0);

  updated.push(buildThread(`thread-detached-${email.id}`, [email]));
  return updated;
}

/** Move an email from its current thread to a different (or new) thread. */
export function rethreadEmail(
  email: Email,
  targetThreadId: string,
  threads: Thread[]
): Thread[] {
  // Remove from all existing threads
  const updated = threads
    .map((t) => ({
      ...t,
      messages: t.messages.filter((m) => m.id !== email.id),
    }))
    .filter((t) => t.messages.length > 0);

  const target = updated.find((t) => t.id === targetThreadId);
  if (target) {
    target.messages = [...target.messages, email];
    // Rebuild the target thread's metadata
    return updated.map((t) =>
      t.id === targetThreadId ? buildThread(t.id, t.messages) : t
    );
  }

  // Target doesn't exist yet — create a new thread
  updated.push(buildThread(targetThreadId, [email]));
  return updated;
}
