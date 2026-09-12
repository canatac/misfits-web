import { describe, expect, it } from "vitest";
import { buildDigest, groupMessages, normalizeSubject, type DigestMessage } from "@/lib/email-digest";

const now = Date.now();
const sample: DigestMessage[] = [
  { id: "1", from: "alice@example.com", subject: "Meeting notes", snippet: "...", receivedAt: now - 1000, threadId: "t1" },
  { id: "2", from: "alice@example.com", subject: "Re: Meeting notes", snippet: "...", receivedAt: now - 500, threadId: "t1" },
  { id: "3", from: "bob@example.com", subject: "Launch plan", snippet: "...", receivedAt: now, threadId: "t2" },
];

describe("email-digest", () => {
  it("normalizes subject prefixes for grouping", () => {
    expect(normalizeSubject("Re: Meeting notes")).toBe("meeting notes");
    expect(normalizeSubject("FWD:  Hello")).toBe("hello");
  });

  it("groups messages by sender + normalized subject", () => {
    const groups = groupMessages(sample);
    expect(groups).toHaveLength(2);
    expect(groups[0].messages).toHaveLength(2);
    expect(groups[1].messages).toHaveLength(1);
  });

  it("builds a digest with correct totals", () => {
    const digest = buildDigest(sample);
    expect(digest.total).toBe(3);
    expect(digest.groups.length).toBe(2);
    expect(typeof digest.generatedAt).toBe("number");
  });
});
