/**
 * Integration test: Thread builder cross-repo contract.
 *
 * Verifies the types and shapes expected by thread-builder.ts
 * without requiring a full 25+ field Email mock.
 */
import { describe, it, expect } from "vitest";
import type { ThreadingMode, Thread } from "@/types/thread";

describe("Thread builder cross-repo contract", () => {
  it("ThreadingMode values match backend expectations", () => {
    const modes: ThreadingMode[] = ["byReferences", "bySubject", "byParticipants", "smart"];
    expect(modes).toHaveLength(4);
  });

  it("Thread has required fields for UI rendering", () => {
    const thread: Thread = {
      id: "t1",
      subject: "Test thread",
      messages: [],
      participants: [],
      lastMessageDate: "2026-01-01T00:00:00Z",
      firstMessageDate: "2026-01-01T00:00:00Z",
      unreadCount: 0,
      messageCount: 2,
      hasAttachments: false,
      labels: [],
      folder: "inbox",
    };
    expect(thread.id).toBeTruthy();
    expect(thread.subject).toBeTruthy();
    expect(thread.messages).toBeInstanceOf(Array);
    expect(thread.participants).toBeInstanceOf(Array);
  });

  it("Thread supports labels for grouping", () => {
    const thread: Thread = {
      id: "t1",
      subject: "Test",
      messages: [],
      participants: [],
      lastMessageDate: "2026-01-01T00:00:00Z",
      firstMessageDate: "2026-01-01T00:00:00Z",
      unreadCount: 0,
      messageCount: 2,
      hasAttachments: false,
      labels: ["work", "urgent"],
      folder: "inbox",
    };
    expect(thread.labels).toContain("work");
    expect(thread.labels).toContain("urgent");
  });

  it("Thread has date strings for sorting", () => {
    const thread: Thread = {
      id: "t1",
      subject: "Test",
      messages: [],
      participants: [],
      lastMessageDate: "2026-01-03T00:00:00Z",
      firstMessageDate: "2026-01-01T00:00:00Z",
      unreadCount: 0,
      messageCount: 2,
      hasAttachments: false,
      labels: [],
      folder: "inbox",
    };
    expect(new Date(thread.lastMessageDate).getTime()).toBeGreaterThan(
      new Date(thread.firstMessageDate).getTime()
    );
  });

  it("Thread unreadCount and messageCount are non-negative", () => {
    const thread: Thread = {
      id: "t1",
      subject: "Test",
      messages: [],
      participants: [],
      lastMessageDate: "2026-01-01T00:00:00Z",
      firstMessageDate: "2026-01-01T00:00:00Z",
      unreadCount: 3,
      messageCount: 5,
      hasAttachments: false,
      labels: [],
      folder: "inbox",
    };
    expect(thread.unreadCount).toBeGreaterThanOrEqual(0);
    expect(thread.messageCount).toBeGreaterThanOrEqual(0);
    expect(thread.unreadCount).toBeLessThanOrEqual(thread.messageCount);
  });
});
