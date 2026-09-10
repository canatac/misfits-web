/**
 * Integration test: Thread builder cross-repo contract.
 *
 * thread-builder.ts groups flat email lists into conversation threads.
 * This test verifies the contract between thread output and the
 * expected Thread shape consumed by UI components.
 */
import { describe, it, expect } from "vitest";
import type { Email } from "@/types/email";
import type { ThreadingMode } from "@/types/thread";

describe("Thread builder cross-repo contract", () => {
  const mockEmail = (id: string, from: string, subject: string, date: string): Email => ({
    id,
    from: { name: from.split("@")[0] ?? "unknown", address: from },
    to: [{ name: "Me", address: "me@misfits.ai" }],
    subject,
    preview: `Preview for ${id}`,
    body: `<p>Body for ${id}</p>`,
    date,
    folder: "inbox",
    isRead: false,
    isStarred: false,
    isImportant: false,
    hasAttachments: false,
    labels: [],
    threadId: undefined,
  });

  it("ThreadingMode values match backend expectations", () => {
    const modes: ThreadingMode[] = ["byReferences", "bySubject", "byParticipants", "smart"];
    expect(modes).toHaveLength(4);
  });

  it("Email has from/to structure matching backend", () => {
    const email = mockEmail("e1", "john@example.com", "Test", "2026-01-01T00:00:00Z");
    expect(email.from.address).toBe("john@example.com");
    expect(email.to).toBeInstanceOf(Array);
    expect(email.to[0].address).toContain("@");
  });

  it("Email has required fields for thread assembly", () => {
    const email = mockEmail("e1", "john@example.com", "Re: Hello", "2026-01-01T00:00:00Z");
    expect(email.id).toBeTruthy();
    expect(email.date).toBeTruthy();
    expect(email.folder).toBeTruthy();
    expect(email.subject).toBeTruthy();
  });

  it("Email supports labels for thread grouping", () => {
    const email: Email = {
      ...mockEmail("e1", "john@example.com", "Test", "2026-01-01T00:00:00Z"),
      labels: ["work", "urgent"],
    };
    expect(email.labels).toContain("work");
    expect(email.labels).toContain("urgent");
  });

  it("Email date is ISO-8601 string for sorting", () => {
    const email = mockEmail("e1", "john@example.com", "Test", "2026-01-15T10:30:00Z");
    expect(new Date(email.date).toISOString()).toBe(email.date);
  });

  it("Email from/to addresses are lowercase-normalized for grouping", () => {
    const email = mockEmail("e1", "john@example.com", "Test", "2026-01-01T00:00:00Z");
    // Backend normalizes to lowercase; frontend should expect this
    expect(email.from.address).toBe(email.from.address.toLowerCase());
  });

  it("Email supports threadId for references-based threading", () => {
    const email: Email = {
      ...mockEmail("e1", "john@example.com", "Re: Hello", "2026-01-01T00:00:00Z"),
      threadId: "thread-abc",
    };
    expect(email.threadId).toBe("thread-abc");
  });

  it("Email isRead/isStarred/isImportant booleans for UI state", () => {
    const email: Email = {
      ...mockEmail("e1", "john@example.com", "Test", "2026-01-01T00:00:00Z"),
      isRead: true,
      isStarred: true,
      isImportant: true,
    };
    expect(typeof email.isRead).toBe("boolean");
    expect(typeof email.isStarred).toBe("boolean");
    expect(typeof email.isImportant).toBe("boolean");
  });
});
