/**
 * Unit tests for instant search index.
 */
import { describe, it, expect } from "vitest";
import {
  EmailSearchIndex,
  createSearchIndex,
  tokenizeQuery,
  highlightMatches,
} from "@/lib/search-index";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "John Doe", address: "john@example.com" },
    to: [{ name: "Me", address: "me@example.com" }],
    subject: "Meeting about project roadmap",
    preview: "Let's discuss the roadmap for next quarter",
    body: "<p>Let's discuss the roadmap for next quarter. We need to plan our goals.</p>",
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

describe("search-index", () => {
  describe("EmailSearchIndex", () => {
    it("indexes and finds emails by subject", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail({ id: "e1", subject: "Meeting tomorrow" }));
      index.indexEmail(makeEmail({ id: "e2", subject: "Lunch plans" }));

      const results = index.search("meeting");
      expect(results).toHaveLength(1);
      expect(results[0].email.id).toBe("e1");
    });

    it("searches by sender name", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail({ id: "e1", from: { name: "Alice", address: "alice@example.com" } }));
      index.indexEmail(makeEmail({ id: "e2", from: { name: "Bob", address: "bob@example.com" } }));

      const results = index.search("alice");
      expect(results).toHaveLength(1);
      expect(results[0].email.id).toBe("e1");
    });

    it("searches by body content", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail({ id: "e1", body: "<p>Project roadmap discussion</p>" }));
      index.indexEmail(makeEmail({ id: "e2", body: "<p>Team lunch</p>" }));

      const results = index.search("roadmap");
      expect(results).toHaveLength(1);
    });

    it("returns empty results for no match", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail());

      const results = index.search("nonexistent");
      expect(results).toHaveLength(0);
    });

    it("removes email from index", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail({ id: "e1" }));
      index.removeEmail("e1");

      const results = index.search("meeting");
      expect(results).toHaveLength(0);
    });

    it("clears all indexed emails", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail({ id: "e1" }));
      index.indexEmail(makeEmail({ id: "e2" }));
      index.clear();

      expect(index.getStats().totalEmails).toBe(0);
    });

    it("provides search suggestions", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail({ subject: "Meeting about project" }));

      const suggestions = index.getSuggestions("meet");
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("returns index statistics", () => {
      const index = createSearchIndex();
      index.indexEmail(makeEmail({ id: "e1" }));

      const stats = index.getStats();
      expect(stats.totalEmails).toBe(1);
      expect(stats.totalTerms).toBeGreaterThan(0);
    });

    it("limits search results", () => {
      const index = createSearchIndex();
      for (let i = 0; i < 10; i++) {
        index.indexEmail(makeEmail({ id: `e${i}`, subject: "common term" }));
      }

      const results = index.search("common", { limit: 5 });
      expect(results).toHaveLength(5);
    });
  });

  describe("tokenizeQuery", () => {
    it("tokenizes query into terms", () => {
      const terms = tokenizeQuery("Hello World");
      expect(terms).toEqual(["hello", "world"]);
    });

    it("removes special characters", () => {
      const terms = tokenizeQuery("hello@world!");
      expect(terms).toEqual(["hello", "world"]);
    });

    it("filters short terms", () => {
      const terms = tokenizeQuery("I am a test");
      expect(terms).toEqual(["test"]);
    });
  });

  describe("highlightMatches", () => {
    it("wraps matches in mark tags", () => {
      const result = highlightMatches("Hello World", "world");
      expect(result).toContain("<mark>World</mark>");
    });

    it("is case insensitive", () => {
      const result = highlightMatches("Hello World", "hello");
      expect(result).toContain("<mark>Hello</mark>");
    });
  });
});
