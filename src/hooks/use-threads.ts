/**
 * Thread hooks — build, select, and act on conversation threads.
 */
import { useMemo, useCallback } from "react";
import type { Email } from "@/types/email";
import type { Thread, ThreadingMode } from "@/types/thread";
import { buildThreads } from "@/lib/thread-builder";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useComposerStore, uid } from "@/stores/composer-store";
import type { Recipient } from "@/types/composer";

/**
 * Build threads from the current email store, memoized.
 * Recomputes when emails or threading mode change.
 */
export function useThreads(mode?: ThreadingMode): Thread[] {
  const emails = useEmailStore((s) => s.emails);
  const threadingMode = useThreadStore((s) => s.threadingMode);
  const effectiveMode = mode ?? threadingMode;

  return useMemo(
    () => buildThreads(emails, effectiveMode),
    [emails, effectiveMode]
  );
}

/**
 * Get a single thread (with all its messages) by thread ID.
 */
export function useThread(threadId: string | null): Thread | null {
  const threads = useThreads();
  return useMemo(
    () => threads.find((t) => t.id === threadId) ?? null,
    [threads, threadId]
  );
}

/**
 * Thread actions: detach, rethread, forward thread, reply to thread.
 */
export function useThreadActions() {
  const detachEmailFromThread = useThreadStore((s) => s.detachEmailFromThread);
  const rethreadEmailAction = useThreadStore((s) => s.rethreadEmail);
  const openComposer = useComposerStore((s) => s.openComposer);

  const toRecipient = useCallback(
    (
      address: string,
      name: string,
      type: Recipient["type"] = "to"
    ): Recipient => ({
      id: uid("rcpt"),
      email: address.toLowerCase(),
      name: name && name !== "me" ? name : undefined,
      type,
    }),
    []
  );

  const detach = useCallback(
    (email: Email) => detachEmailFromThread(email),
    [detachEmailFromThread]
  );

  const rethread = useCallback(
    (email: Email, targetThreadId: string) =>
      rethreadEmailAction(email, targetThreadId),
    [rethreadEmailAction]
  );

  /** Forward an entire thread as a single email. */
  const forwardThread = useCallback(
    (thread: Thread) => {
      const bodies = thread.messages.map((e) => {
        const date = new Date(e.date).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        return `<p><strong>From:</strong> ${e.from.name} &lt;${e.from.address}&gt;<br/><strong>Date:</strong> ${date}<br/><strong>Subject:</strong> ${e.subject}</p>${e.body}<hr/>`;
      });
      const body = `<p>---------- Forwarded thread (${thread.messageCount} messages) ----------</p>${bodies.join("")}`;
      openComposer({
        to: [],
        subject: `Fwd: ${thread.subject}`,
        body,
      });
    },
    [openComposer]
  );

  /** Reply to the most recent message in a thread. */
  const replyToThread = useCallback(
    (thread: Thread) => {
      const last = thread.messages[thread.messages.length - 1];
      if (!last) return;
      const replyDate = new Date(last.date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      const replyBody = `<p></p><blockquote>On ${replyDate}, ${last.from.name} &lt;${last.from.address}&gt; wrote:<br/>${last.body}</blockquote>`;
      const replyTarget = last.replyTo ?? last.from;
      openComposer({
        to: [toRecipient(replyTarget.address, replyTarget.name)],
        cc: (last.cc ?? []).map((a) => toRecipient(a.address, a.name, "cc")),
        subject: last.subject.startsWith("Re: ")
          ? last.subject
          : `Re: ${last.subject}`,
        body: replyBody,
        inReplyTo: last.messageId,
        references: [...(last.references ?? []), last.messageId].filter(
          Boolean
        ),
      });
    },
    [openComposer, toRecipient]
  );

  return { detach, rethread, forwardThread, replyToThread };
}
