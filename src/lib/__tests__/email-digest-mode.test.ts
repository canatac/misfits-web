import { describe, expect, it } from "vitest";
import {
  buildDigests,
  digestDisplayName,
  digestStats,
  expandDigest,
  extractDigestKey,
  extractSubjectPrefix,
  flattenDigests,
} from "@/lib/email-digest-mode";

function makeEmail(overrides: {
  id: string;
  from: { name?: string; address: string };
  subject: string;
  date: string;
  isRead?: boolean;
  isStarred?: boolean;
  size?: number;
}) {
  return {
    isRead: false,
    isStarred: false,
    size: 100,
    ...overrides,
  };
}

describe("email-digest-mode", () => {
  it("extracts domain key for domain strategy", () => {
    const email = makeEmail({
      id: "1",
      from: { address: "user@example.com" },
      subject: "Hello",
      date: "2027-01-01T00:00:00Z",
    });
    expect(extractDigestKey("domain", email)).toBe("example.com");
  });

  it("extracts sender address key for sender strategy", () => {
    const email = makeEmail({
      id: "1",
      from: { address: "User@Example.com" },
      subject: "Hello",
      date: "2027-01-01T00:00:00Z",
    });
    expect(extractDigestKey("sender", email)).toBe("user@example.com");
  });

  it("extracts subject prefix removing Re:/Fwd:", () => {
    expect(extractSubjectPrefix("Re: Fwd: Quarterly report")).toBe("Quarterly report");
    expect(extractSubjectPrefix("Hello world")).toBe("Hello world");
    expect(extractSubjectPrefix("Project — status update")).toBe("Project");
  });

  it("builds digest groups by domain", () => {
    const emails = [
      makeEmail({ id: "a", from: { address: "x@a.com" }, subject: "S1", date: "2027-01-03T00:00:00Z" }),
      makeEmail({ id: "b", from: { address: "y@a.com" }, subject: "S2", date: "2027-01-02T00:00:00Z" }),
      makeEmail({ id: "c", from: { address: "z@b.com" }, subject: "S3", date: "2027-01-01T00:00:00Z" }),
    ];
    const digests = buildDigests("domain", emails);
    expect(digests).toHaveLength(2);
    expect(digests[0].key).toBe("a.com");
    expect(digests[0].count).toBe(2);
    expect(digests[0].emailIds).toContain("a");
    expect(digests[0].emailIds).toContain("b");
  });

  it("counts unread and starred per group", () => {
    const emails = [
      makeEmail({ id: "1", from: { address: "x@a.com" }, subject: "S", date: "2027-01-01T00:00:00Z", isRead: true, isStarred: true }),
      makeEmail({ id: "2", from: { address: "y@a.com" }, subject: "S", date: "2027-01-01T00:00:00Z" }),
      makeEmail({ id: "3", from: { address: "z@a.com" }, subject: "S", date: "2027-01-01T00:00:00Z" }),
    ];
    const digests = buildDigests("domain", emails);
    expect(digests).toHaveLength(1);
    const group = digests[0];
    expect(group.count).toBe(3);
    expect(group.unreadCount).toBe(2);
    expect(group.starredCount).toBe(1);
  });

  it("sorts groups by latest date first, then count", () => {
    const emails = [
      makeEmail({ id: "1", from: { address: "x@a.com" }, subject: "S", date: "2027-01-01T00:00:00Z" }),
      makeEmail({ id: "2", from: { address: "y@b.com" }, subject: "S", date: "2027-01-05T00:00:00Z" }),
      makeEmail({ id: "3", from: { address: "z@c.com" }, subject: "S", date: "2027-01-03T00:00:00Z" }),
    ];
    const digests = buildDigests("domain", emails);
    expect(digests[0].key).toBe("b.com");
    expect(digests[1].key).toBe("c.com");
    expect(digests[2].key).toBe("a.com");
  });

  it("groups by subject prefix", () => {
    const emails = [
      makeEmail({ id: "1", from: { address: "x@a.com" }, subject: "Re: Invoice", date: "2027-01-01T00:00:00Z" }),
      makeEmail({ id: "2", from: { address: "y@b.com" }, subject: "Fwd: Invoice", date: "2027-01-02T00:00:00Z" }),
      makeEmail({ id: "3", from: { address: "z@c.com" }, subject: "Meeting notes", date: "2027-01-03T00:00:00Z" }),
    ];
    const digests = buildDigests("subject-prefix", emails);
    expect(digests).toHaveLength(2);
    const invoice = digests.find((d: { key: string }) => d.key === "Invoice");
    expect(invoice?.count).toBe(2);
  });

  it("expands a digest to its email ids", () => {
    const digest = {
      key: "a.com",
      displayName: "a.com",
      count: 2,
      totalSize: 200,
      latestDate: "2027-01-01T00:00:00Z",
      unreadCount: 1,
      starredCount: 0,
      emailIds: ["x", "y"],
    };
    expect(expandDigest(digest)).toEqual(["x", "y"]);
  });

  it("flattens digests into lists of ids", () => {
    const digests = [
      { key: "a", displayName: "a", count: 1, totalSize: 1, latestDate: "2027-01-01", unreadCount: 0, starredCount: 0, emailIds: ["x"] },
      { key: "b", displayName: "b", count: 1, totalSize: 1, latestDate: "2027-01-01", unreadCount: 0, starredCount: 0, emailIds: ["y"] },
    ];
    expect(flattenDigests(digests)).toEqual([["x"], ["y"]]);
  });

  it("computes digest stats", () => {
    const digests = [
      { key: "a", displayName: "a", count: 3, totalSize: 300, latestDate: "2027-01-01", unreadCount: 1, starredCount: 0, emailIds: ["1", "2", "3"] },
      { key: "b", displayName: "b", count: 2, totalSize: 200, latestDate: "2027-01-01", unreadCount: 2, starredCount: 1, emailIds: ["4", "5"] },
    ];
    const stats = digestStats(digests);
    expect(stats.totalGroups).toBe(2);
    expect(stats.totalEmails).toBe(5);
    expect(stats.totalUnread).toBe(3);
  });

  it("returns display name for each strategy", () => {
    expect(digestDisplayName("sender", "me@x.com")).toBe("me@x.com");
    expect(digestDisplayName("domain", "example.com")).toBe("example.com");
    expect(digestDisplayName("subject-prefix", "")).toBe("(no subject)");
  });
});
