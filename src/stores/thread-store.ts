/**
 * Zustand store for thread / conversation state.
 * Manages threading mode, expanded threads, thread selection, and re-threading.
 * Threads are rebuilt from the email store's current emails.
 */
import { create } from "zustand";
import type { Email } from "@/types/email";
import type { Thread, ThreadingMode } from "@/types/thread";
import { buildThreads } from "@/lib/thread-builder";

interface ThreadState {
  // Data
  threads: Thread[];
  threadingEnabled: boolean;
  threadingMode: ThreadingMode;
  expandedThreadIds: Set<string>;
  selectedThreadId: string | null;
  viewMode: "list" | "timeline";

  // Actions
  toggleThreading: () => void;
  setThreadingMode: (mode: ThreadingMode) => void;
  setViewMode: (mode: "list" | "timeline") => void;
  toggleThreadExpand: (threadId: string) => void;
  selectThread: (threadId: string | null) => void;
  rebuildThreads: (emails: Email[]) => void;
  detachEmailFromThread: (email: Email) => void;
  rethreadEmail: (email: Email, targetThreadId: string) => void;
  isThreadExpanded: (threadId: string) => boolean;
}

/** Build a singleton Thread from a single email. */
function singletonThread(email: Email, id?: string): Thread {
  return {
    id: id ?? `thread-detached-${email.id}`,
    subject: email.subject,
    messages: [email],
    participants: [email.from, ...email.to, ...(email.cc ?? [])],
    lastMessageDate: email.date,
    firstMessageDate: email.date,
    unreadCount: email.isRead ? 0 : 1,
    messageCount: 1,
    hasAttachments: email.hasAttachments,
    labels: email.labels,
    folder: email.folder,
  };
}

export const useThreadStore = create<ThreadState>((set, get) => ({
  threads: [],
  threadingEnabled: false,
  threadingMode: "smart",
  expandedThreadIds: new Set(),
  selectedThreadId: null,
  viewMode: "list",

  toggleThreading: () =>
    set((s) => ({ threadingEnabled: !s.threadingEnabled })),

  setThreadingMode: (mode) => {
    set({ threadingMode: mode });
    // Rebuild threads with the new mode
    // The caller (useThreads hook) will rebuild automatically via useMemo.
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleThreadExpand: (threadId) =>
    set((s) => {
      const next = new Set(s.expandedThreadIds);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return { expandedThreadIds: next };
    }),

  selectThread: (threadId) => set({ selectedThreadId: threadId }),

  rebuildThreads: (emails) =>
    set({ threads: buildThreads(emails, get().threadingMode) }),

  detachEmailFromThread: (email) => {
    const threads = get().threads;
    if (threads.length === 0) return;
    const updated = threads
      .map((t) => ({
        ...t,
        messages: t.messages.filter((m) => m.id !== email.id),
      }))
      .filter((t) => t.messages.length > 0);
    updated.push(singletonThread(email));
    set({ threads: updated });
  },

  rethreadEmail: (email, targetThreadId) => {
    const threads = get().threads;
    if (threads.length === 0) return;
    const updated = threads
      .map((t) => ({
        ...t,
        messages: t.messages.filter((m) => m.id !== email.id),
      }))
      .filter((t) => t.messages.length > 0);

    const target = updated.find((t) => t.id === targetThreadId);
    if (target) {
      target.messages = [...target.messages, email].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      // Rebuild target thread metadata
      const rebuilt = updated.map((t) =>
        t.id === targetThreadId
          ? {
              ...t,
              participants: [...new Map(
                t.messages.flatMap((e) => [e.from, ...e.to, ...(e.cc ?? [])])
                  .map((p) => [p.address, p]),
              ).values()],
              lastMessageDate: t.messages[t.messages.length - 1].date,
              firstMessageDate: t.messages[0].date,
              unreadCount: t.messages.filter((e) => !e.isRead).length,
              messageCount: t.messages.length,
              hasAttachments: t.messages.some((e) => e.hasAttachments),
              labels: [...new Set(t.messages.flatMap((e) => e.labels))],
            }
          : t,
      );
      set({ threads: rebuilt });
    } else {
      updated.push(singletonThread(email, targetThreadId));
      set({ threads: updated });
    }
  },

  isThreadExpanded: (threadId) => get().expandedThreadIds.has(threadId),
}));
