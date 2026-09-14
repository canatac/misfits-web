/**
 * Unit tests for thread actions utility.
 */
import { describe, it, expect } from "vitest";
import {
  applyActionToThread,
  getEmailIdsFromThreads,
  createThreadActionResult,
  toggleThreadSelection,
  selectAllThreads,
  clearSelection,
  isThreadSelected,
  getThreadActionLabel,
  getThreadActionIcon,
  isDestructiveAction,
  getAvailableThreadActions,
  countEmailsInThreads,
  filterThreadsBySelection,
} from "@/lib/thread-actions";
import type { Thread } from "@/types/thread";
import type { Email } from "@/types/email";

function makeEmail(id: string): Email {
  return {
    id,
    threadId: "t1",
    folder: "inbox",
    from: { name: "Test", address: "test@example.com" },
    to: [{ name: "Me", address: "me@example.com" }],
    subject: "Test",
    preview: "Test",
    body: "<p>Test</p>",
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
    messageId: `<${id}@example.com>`,
  };
}

function makeThread(id: string, messageCount: number): Thread {
  const messages = Array.from({ length: messageCount }, (_, i) => makeEmail(`${id}-e${i}`));
  return {
    id,
    subject: `Thread ${id}`,
    messages,
    participants: [],
    lastMessageDate: "2026-09-10T12:00:00Z",
    firstMessageDate: "2026-09-10T12:00:00Z",
    unreadCount: 0,
    messageCount,
    hasAttachments: false,
    labels: [],
    folder: "inbox",
  };
}

describe("thread-actions", () => {
  describe("applyActionToThread", () => {
    it("returns all email IDs in thread", () => {
      const thread = makeThread("t1", 3);
      const ids = applyActionToThread(thread, "delete");
      expect(ids).toHaveLength(3);
      expect(ids[0]).toBe("t1-e0");
    });
  });

  describe("getEmailIdsFromThreads", () => {
    it("gets email IDs from selected threads", () => {
      const threads = [makeThread("t1", 2), makeThread("t2", 3)];
      const ids = getEmailIdsFromThreads(threads, ["t1"]);
      expect(ids).toHaveLength(2);
    });

    it("gets email IDs from multiple threads", () => {
      const threads = [makeThread("t1", 2), makeThread("t2", 3)];
      const ids = getEmailIdsFromThreads(threads, ["t1", "t2"]);
      expect(ids).toHaveLength(5);
    });
  });

  describe("createThreadActionResult", () => {
    it("creates result with timestamp", () => {
      const result = createThreadActionResult("delete", ["t1"], 3);
      expect(result.success).toBe(true);
      expect(result.action).toBe("delete");
      expect(result.threadIds).toEqual(["t1"]);
      expect(result.affectedEmails).toBe(3);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe("toggleThreadSelection", () => {
    it("adds thread to selection", () => {
      const result = toggleThreadSelection([], "t1");
      expect(result).toEqual(["t1"]);
    });

    it("removes thread from selection", () => {
      const result = toggleThreadSelection(["t1", "t2"], "t1");
      expect(result).toEqual(["t2"]);
    });
  });

  describe("selectAllThreads", () => {
    it("selects all thread IDs", () => {
      const result = selectAllThreads(["t1", "t2", "t3"]);
      expect(result).toEqual(["t1", "t2", "t3"]);
    });
  });

  describe("clearSelection", () => {
    it("returns empty array", () => {
      expect(clearSelection()).toEqual([]);
    });
  });

  describe("isThreadSelected", () => {
    it("returns true when selected", () => {
      expect(isThreadSelected(["t1", "t2"], "t1")).toBe(true);
    });

    it("returns false when not selected", () => {
      expect(isThreadSelected(["t1"], "t2")).toBe(false);
    });
  });

  describe("getThreadActionLabel", () => {
    it("returns correct labels", () => {
      expect(getThreadActionLabel("delete")).toBe("Delete thread");
      expect(getThreadActionLabel("archive")).toBe("Archive thread");
      expect(getThreadActionLabel("markRead")).toBe("Mark as read");
      expect(getThreadActionLabel("markUnread")).toBe("Mark as unread");
      expect(getThreadActionLabel("star")).toBe("Star thread");
    });
  });

  describe("getThreadActionIcon", () => {
    it("returns correct icons", () => {
      expect(getThreadActionIcon("delete")).toBe("trash");
      expect(getThreadActionIcon("archive")).toBe("archive");
      expect(getThreadActionIcon("markRead")).toBe("mail-open");
    });
  });

  describe("isDestructiveAction", () => {
    it("returns true for delete", () => {
      expect(isDestructiveAction("delete")).toBe(true);
    });

    it("returns false for non-destructive", () => {
      expect(isDestructiveAction("archive")).toBe(false);
      expect(isDestructiveAction("markRead")).toBe(false);
    });
  });

  describe("getAvailableThreadActions", () => {
    it("returns all actions", () => {
      const actions = getAvailableThreadActions();
      expect(actions).toHaveLength(5);
      expect(actions[0].action).toBe("markRead");
    });
  });

  describe("countEmailsInThreads", () => {
    it("counts emails correctly", () => {
      const threads = [makeThread("t1", 2), makeThread("t2", 3)];
      expect(countEmailsInThreads(threads, ["t1"])).toBe(2);
      expect(countEmailsInThreads(threads, ["t1", "t2"])).toBe(5);
    });
  });

  describe("filterThreadsBySelection", () => {
    it("filters threads", () => {
      const threads = [makeThread("t1", 1), makeThread("t2", 1)];
      const result = filterThreadsBySelection(threads, ["t1"]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t1");
    });
  });
});
