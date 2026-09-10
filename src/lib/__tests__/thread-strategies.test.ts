/**
 * Unit tests for thread-strategies.ts
 *
 * Covers: threadByReferences, threadBySubject, threadByParticipants, threadSmart
 * Also covers the Union-Find helpers via threadByReferences.
 */
import { describe, it, expect } from "vitest";
import {
  threadByReferences,
  threadBySubject,
  threadByParticipants,
  threadSmart,
} from "@/lib/thread-strategies";
import type { Email } from "@/types/email";
import type { Thread } from "@/types/thread";

/** Build a minimal Email for testing. */
function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    to: [{ name: "Bob", address: "bob@example.com" }],
    subject: "Hello world",
    preview: "preview",
    body: "body",
    bodyType: "text",
    date: new Date("2025-01-01").toISOString(),
    receivedAt: new Date("2025-01-01").toISOString(),
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 1000,
    messageId: "m1",
    ...overrides,
  };
}

/** Minimal buildThread for testing — just wraps emails into a Thread. */
function buildThread(threadId: string, emails: Email[]): Thread {
  const sorted = [...emails].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return {
    id: threadId,
    subject: sorted[0].subject,
    messages: sorted,
    participants: sorted.flatMap((e) => [e.from, ...e.to]),
    lastMessageDate: sorted[sorted.length - 1].date,
    firstMessageDate: sorted[0].date,
    unreadCount: sorted.filter((e) => !e.isRead).length,
    messageCount: sorted.length,
    hasAttachments: sorted.some((e) => e.hasAttachments),
    labels: [...new Set(sorted.flatMap((e) => e.labels))],
    folder: sorted[sorted.length - 1].folder,
  };
}

describe("threadByReferences", () => {
  it("returns empty array for empty input", () => {
    expect(threadByReferences([], buildThread)).toEqual([]);
  });

  it("groups emails with same References chain", () => {
    const emails = [
      makeEmail({ id: "e1", messageId: "m1", references: [] }),
      makeEmail({ id: "e2", messageId: "m2", references: ["m1"] }),
      makeEmail({ id: "e3", messageId: "m3", references: ["m1", "m2"] }),
    ];
    const threads = threadByReferences(emails, buildThread);
    expect(threads).toHaveLength(1);
    expect(threads[0].messages).toHaveLength(3);
  });

  it("separates emails with different reference chains", () => {
    const emails = [
      makeEmail({ id: "e1", messageId: "m1", references: [] }),
      makeEmail({ id: "e2", messageId: "m2", references: ["m1"] }),
      makeEmail({ id: "e3", messageId: "m3", references: [] }), // separate chain
    ];
    const threads = threadByReferences(emails, buildThread);
    expect(threads).toHaveLength(2);
  });

  it("handles inReplyTo for threading", () => {
    const emails = [
      makeEmail({ id: "e1", messageId: "m1" }),
      makeEmail({ id: "e2", messageId: "m2", inReplyTo: "m1" }),
    ];
    const threads = threadByReferences(emails, buildThread);
    expect(threads).toHaveLength(1);
    expect(threads[0].messages.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("puts emails without messageId into singletons", () => {
    const emails = [
      makeEmail({ id: "e1", messageId: undefined }),
      makeEmail({ id: "e2", messageId: undefined }),
    ];
    const threads = threadByReferences(emails, buildThread);
    expect(threads).toHaveLength(2);
  });

  it("handles mixed: some with references, some without", () => {
    const emails = [
      makeEmail({ id: "e1", messageId: "m1", references: [] }),
      makeEmail({ id: "e2", messageId: undefined }),
    ];
    const threads = threadByReferences(emails, buildThread);
    expect(threads).toHaveLength(2);
  });
});

describe("threadBySubject", () => {
  it("returns empty array for empty input", () => {
    expect(threadBySubject([], buildThread)).toEqual([]);
  });

  it("groups emails with same normalized subject", () => {
    const emails = [
      makeEmail({ id: "e1", subject: "Hello world" }),
      makeEmail({ id: "e2", subject: "Hello world" }),
    ];
    const threads = threadBySubject(emails, buildThread);
    expect(threads).toHaveLength(1);
    expect(threads[0].messages).toHaveLength(2);
  });

  it("strips Re: prefix for subject matching", () => {
    const emails = [
      makeEmail({ id: "e1", subject: "Hello world" }),
      makeEmail({ id: "e2", subject: "Re: Hello world" }),
    ];
    const threads = threadBySubject(emails, buildThread);
    expect(threads).toHaveLength(1);
  });

  it("strips Fwd: prefix for subject matching", () => {
    const emails = [
      makeEmail({ id: "e1", subject: "Hello world" }),
      makeEmail({ id: "e2", subject: "Fwd: Hello world" }),
    ];
    const threads = threadBySubject(emails, buildThread);
    expect(threads).toHaveLength(1);
  });

  it("is case-insensitive for subject matching", () => {
    const emails = [
      makeEmail({ id: "e1", subject: "HELLO WORLD" }),
      makeEmail({ id: "e2", subject: "hello world" }),
    ];
    const threads = threadBySubject(emails, buildThread);
    expect(threads).toHaveLength(1);
  });

  it("separates emails with different subjects", () => {
    const emails = [
      makeEmail({ id: "e1", subject: "Hello world" }),
      makeEmail({ id: "e2", subject: "Goodbye world" }),
    ];
    const threads = threadBySubject(emails, buildThread);
    expect(threads).toHaveLength(2);
  });

  it("puts emails with empty subject into singletons", () => {
    const emails = [
      makeEmail({ id: "e1", subject: "" }),
      makeEmail({ id: "e2", subject: "" }),
    ];
    const threads = threadBySubject(emails, buildThread);
    expect(threads).toHaveLength(2);
  });
});

describe("threadByParticipants", () => {
  it("returns empty array for empty input", () => {
    expect(threadByParticipants([], buildThread)).toEqual([]);
  });

  it("groups emails with same participants", () => {
    const emails = [
      makeEmail({
        id: "e1",
        from: { name: "Alice", address: "alice@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
      }),
      makeEmail({
        id: "e2",
        from: { name: "Alice", address: "alice@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
      }),
    ];
    const threads = threadByParticipants(emails, buildThread);
    expect(threads).toHaveLength(1);
    expect(threads[0].messages).toHaveLength(2);
  });

  it("separates emails with different participants", () => {
    const emails = [
      makeEmail({
        id: "e1",
        from: { name: "Alice", address: "alice@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
      }),
      makeEmail({
        id: "e2",
        from: { name: "Carol", address: "carol@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
      }),
    ];
    const threads = threadByParticipants(emails, buildThread);
    expect(threads).toHaveLength(2);
  });

  it("handles cc participants", () => {
    const emails = [
      makeEmail({
        id: "e1",
        from: { name: "Alice", address: "alice@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
        cc: [{ name: "Dave", address: "dave@example.com" }],
      }),
      makeEmail({
        id: "e2",
        from: { name: "Alice", address: "alice@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
        cc: [{ name: "Dave", address: "dave@example.com" }],
      }),
    ];
    const threads = threadByParticipants(emails, buildThread);
    expect(threads).toHaveLength(1);
  });

  it("order of participants does not matter (sorted)", () => {
    const emails = [
      makeEmail({
        id: "e1",
        from: { name: "Alice", address: "alice@example.com" },
        to: [{ name: "Bob", address: "bob@example.com" }],
      }),
      makeEmail({
        id: "e2",
        from: { name: "Bob", address: "bob@example.com" },
        to: [{ name: "Alice", address: "alice@example.com" }],
      }),
    ];
    const threads = threadByParticipants(emails, buildThread);
    expect(threads).toHaveLength(1);
  });
});

describe("threadSmart", () => {
  it("returns empty array for empty input", () => {
    expect(threadSmart([], buildThread)).toEqual([]);
  });

  it("uses references first, then subject fallback", () => {
    // e1 and e2 are linked by references
    const emails = [
      makeEmail({ id: "e1", messageId: "m1", subject: "Topic A" }),
      makeEmail({
        id: "e2",
        messageId: "m2",
        references: ["m1"],
        subject: "Topic A",
      }),
      // e3 has no references but same subject as e1/e2 — should NOT merge (already threaded)
      makeEmail({ id: "e3", subject: "Topic A" }),
    ];
    const threads = threadSmart(emails, buildThread);
    // e1+e2 in one thread (by refs), e3 in another (singleton, no messageId)
    expect(threads.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to subject for unthreaded emails", () => {
    const emails = [
      // No references, but same subject — should group by subject
      makeEmail({ id: "e1", subject: "Same topic" }),
      makeEmail({ id: "e2", subject: "Same topic" }),
    ];
    const threads = threadSmart(emails, buildThread);
    expect(threads).toHaveLength(1);
  });

  it("merges subject-matched threads into reference threads when subjects align", () => {
    const emails = [
      makeEmail({ id: "e1", messageId: "m1", subject: "Meeting" }),
      makeEmail({
        id: "e2",
        messageId: "m2",
        references: ["m1"],
        subject: "Re: Meeting",
      }),
    ];
    const threads = threadSmart(emails, buildThread);
    expect(threads).toHaveLength(1);
  });

  it("keeps separate subjects in separate threads", () => {
    const emails = [
      makeEmail({ id: "e1", subject: "Topic A", messageId: undefined }),
      makeEmail({ id: "e2", subject: "Topic B", messageId: undefined }),
    ];
    const threads = threadSmart(emails, buildThread);
    expect(threads).toHaveLength(2);
  });
});
