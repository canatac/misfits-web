import { describe, expect, it } from "vitest";
import {
  createRule,
  findMatchingRules,
  matchesRule,
  toggleRule,
} from "@/lib/multi-account-forwarding";

describe("multi-account-forwarding", () => {
  it("creates a rule with defaults", () => {
    const r = createRule("acct1", "target@example.com");
    expect(r.accountId).toBe("acct1");
    expect(r.enabled).toBe(true);
    expect(r.pattern).toBeNull();
  });

  it("matches subject against pattern (case-insensitive)", () => {
    const r = createRule("acct1", "t@example.com", "invoice");
    expect(matchesRule(r, "New Invoice #123")).toBe(true);
    expect(matchesRule(r, "hello world")).toBe(false);
  });

  it("matches all when pattern is null", () => {
    const r = createRule("acct1", "t@example.com");
    expect(matchesRule(r, "anything")).toBe(true);
  });

  it("does not match disabled rules", () => {
    const r = { ...createRule("acct1", "t@example.com", "test"), enabled: false };
    expect(matchesRule(r, "test email")).toBe(false);
  });

  it("filters by account and subject", () => {
    const rules = [
      createRule("acct1", "a@x.com", "invoice"),
      createRule("acct2", "b@x.com", "invoice"),
      createRule("acct1", "c@x.com"),
    ];
    const matched = findMatchingRules(rules, "acct1", "Invoice received");
    expect(matched).toHaveLength(2);
  });

  it("toggles a rule by id", () => {
    const r = createRule("acct1", "t@example.com");
    const toggled = toggleRule([r], r.id);
    expect(toggled[0].enabled).toBe(false);
  });
});
