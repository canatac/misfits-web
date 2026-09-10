/**
 * Unit tests for thread grouping utility.
 */
import { describe, it, expect } from "vitest";
import {
  groupEmailsIntoThreads,
  normalizeSubject,
  getLatestMessage,
  isThreadUnread,
  getThreadPreview,
} from "@/lib/thread-grouper";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Sender", address: "sender@example.com" },
    to: [{ name: "Recipient", address: "recipient@example.com" }],
    subject: "Test Subject",
    preview: "Test preview",
    body: "<p>Test body</p>",
    bodyType: "html",
    date: "2026-09-10T12:00:00Z",
    receivedAt: "2026-09-10T12:00:00Z",
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    size: 1024,
    messageId: "<test@example.com>",
    ...overrides,
  };
}

describe("thread-grouper", () => {
  describe("normalizeSubject", () => {
    it("strips Re: prefix", () => {
      expect(normalizeSubject("Re: Test")).toBe("Test");
    });

    it("strips Fwd: prefix", () => {
      expect(normalizeSubject("Fwd: Test")).toBe("Test");
    });

    it("strips multiple prefixes", () => {
      expect(normalizeSubject("Re: Re: Fwd: Test")).toBe("Test");
    });

    it("leaves subject without prefix unchanged", () => {
      expect(normalizeSubject("Test Subject")).toBe("Test Subject");
    });
  });

  describe("groupEmailsIntoThreads", () => {
    it("groups emails by threadId", () => {
      const emails = [
        makeEmail({ id: "e1", threadId: "t1" }),
        makeEmail({ id: "e2", threadId: "t1" }),
        makeEmail({ id: "e3", threadId: "t2" }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(result.totalCount).toBe(2);
      expect(result.threads[0].messageCount).toBe(2);
      expect(result.threads[1].messageCount).toBe(1);
    });

    it("groups emails by subject when threadId is missing", () => {
      const emails = [
        makeEmail({ id: "e1", threadId: undefined, subject: "Hello" }),
        makeEmail({ id: "e2", threadId: undefined, subject: "Re: Hello" }),
        makeEmail({ id: "e3", threadId: undefined, subject: "Other" }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(result.totalCount).toBe(2);
    });

    it("sorts threads by most recent message first", () => {
      const emails = [
        makeEmail({ id: "e1", threadId: "t1", date: "2026-09-09T12:00:00Z" }),
        makeEmail({ id: "e2", threadId: "t2", date: "2026-09-10T12:00:00Z" }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(result.threads[0].id).toBe("t2");
      expect(result.threads[1].id).toBe("t1");
    });

    it("counts unread messages correctly", () => {
      const emails = [
        makeEmail({ id: "e1", threadId: "t1", isRead: false }),
        makeEmail({ id: "e2", threadId: "t1", isRead: true }),
        makeEmail({ id: "e3", threadId: "t1", isRead: false }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(result.threads[0].unreadCount).toBe(2);
      expect(result.unreadCount).toBe(2);
    });

    it("detects attachments in thread", () => {
      const emails = [
        makeEmail({ id: "e1", threadId: "t1", hasAttachments: false }),
        makeEmail({ id: "e2", threadId: "t1", hasAttachments: true }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(result.threads[0].hasAttachments).toBe(true);
    });

    it("merges labels from all messages", () => {
      const emails = [
        makeEmail({ id: "e1", threadId: "t1", labels: ["work"] }),
        makeEmail({ id: "e2", threadId: "t1", labels: ["urgent"] }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(result.threads[0].labels).toContain("work");
      expect(result.threads[0].labels).toContain("urgent");
    });

    it("gets unique participants", () => {
      const emails = [
        makeEmail({
          id: "e1",
          threadId: "t1",
          from: { name: "A", address: "a@example.com" },
          to: [{ name: "B", address: "b@example.com" }],
        }),
        makeEmail({
          id: "e2",
          threadId: "t1",
          from: { name: "B", address: "b@example.com" },
          to: [{ name: "A", address: "a@example.com" }],
        }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(result.threads[0].participants.length).toBe(2);
    });
  });

  describe("getLatestMessage", () => {
    it("returns the most recent message", () => {
      const emails = [
        makeEmail({ id: "e1", date: "2026-09-09T12:00:00Z" }),
        makeEmail({ id: "e2", date: "2026-09-10T12:00:00Z" }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(getLatestMessage(result.threads[0]).id).toBe("e2");
    });
  });

  describe("isThreadUnread", () => {
    it("returns true when thread has unread messages", () => {
      const emails = [makeEmail({ id: "e1", isRead: false })];
      const result = groupEmailsIntoThreads(emails);
      expect(isThreadUnread(result.threads[0])).toBe(true);
    });

    it("returns false when all messages are read", () => {
      const emails = [makeEmail({ id: "e1", isRead: true })];
      const result = groupEmailsIntoThreads(emails);
      expect(isThreadUnread(result.threads[0])).toBe(false);
    });
  });

  describe("getThreadPreview", () => {
    it("returns preview from latest message", () => {
      const emails = [
        makeEmail({ id: "e1", preview: "First" }),
        makeEmail({ id: "e2", preview: "Latest preview" }),
      ];
      const result = groupEmailsIntoThreads(emails);
      expect(getThreadPreview(result.threads[0])).toBe("Latest preview");
    });
  });
});
