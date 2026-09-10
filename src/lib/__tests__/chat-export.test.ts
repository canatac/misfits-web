/**
 * Unit tests for AI chat export.
 */
import { describe, it, expect } from "vitest";
import {
  exportAsMarkdown,
  exportAsPlainText,
  generateFilename,
  getConversationStats,
} from "@/lib/chat-export";
import type { ChatConversation } from "@/lib/chat-export";

function makeConversation(): ChatConversation {
  return {
    id: "conv-1",
    title: "Test Chat",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Hello, how are you?",
        timestamp: "2026-09-10T12:00:00Z",
      },
      {
        id: "m2",
        role: "assistant",
        content: "I'm doing well, thanks! How can I help?",
        timestamp: "2026-09-10T12:01:00Z",
        references: ["https://example.com"],
      },
    ],
    createdAt: "2026-09-10T12:00:00Z",
    updatedAt: "2026-09-10T12:01:00Z",
  };
}

describe("chat-export", () => {
  describe("exportAsMarkdown", () => {
    it("exports conversation as markdown", () => {
      const md = exportAsMarkdown(makeConversation());
      expect(md).toContain("# Test Chat");
      expect(md).toContain("**You**");
      expect(md).toContain("**Hermes**");
    });

    it("includes timestamps when enabled", () => {
      const md = exportAsMarkdown(makeConversation(), { includeTimestamps: true, includeReferences: true });
      expect(md).toContain("2026");
    });

    it("includes references when enabled", () => {
      const md = exportAsMarkdown(makeConversation(), { includeTimestamps: false, includeReferences: true });
      expect(md).toContain("References:");
      expect(md).toContain("https://example.com");
    });
  });

  describe("exportAsPlainText", () => {
    it("exports as plain text", () => {
      const text = exportAsPlainText(makeConversation());
      expect(text).toContain("Test Chat");
      expect(text).toContain("You:");
      expect(text).toContain("Hermes:");
    });
  });

  describe("generateFilename", () => {
    it("generates filename with date", () => {
      const filename = generateFilename(makeConversation(), "md");
      expect(filename).toMatch(/^hermes-chat-.*-\d{4}-\d{2}-\d{2}\.md$/);
    });
  });

  describe("getConversationStats", () => {
    it("returns correct stats", () => {
      const stats = getConversationStats(makeConversation());
      expect(stats.totalMessages).toBe(2);
      expect(stats.userMessages).toBe(1);
      expect(stats.assistantMessages).toBe(1);
      expect(stats.referencesCount).toBe(1);
    });
  });
});
