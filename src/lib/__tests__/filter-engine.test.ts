/**
 * Tests for the filter/rule evaluation engine (Issue #146).
 * The engine functions are pure and don't touch the store, so we test them
 * directly with synthetic emails.
 */
import { describe, it, expect } from "vitest";
import {
  testRule,
  testRuleAgainstEmail,
  applyRules,
} from "@/stores/filter-store";
import type { Filter } from "@/types/label";
import type { Email } from "@/types/email";

function makeEmail(overrides: Partial<Email> = {}): Email {
  return {
    id: "e1",
    threadId: "t1",
    folder: "inbox",
    from: { name: "Alice", address: "alice@example.com" },
    to: [{ name: "Bob", address: "bob@example.com" }],
    subject: "Hello world",
    preview: "preview",
    body: "This is the email body",
    bodyType: "text",
    date: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
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

const baseRule: Filter = {
  id: "r1",
  name: "test rule",
  conditions: [],
  actions: [],
  enabled: true,
  priority: 0,
  createdAt: new Date().toISOString(),
};

describe("filter engine — testRuleAgainstEmail", () => {
  it("returns false when there are no conditions", () => {
    expect(testRuleAgainstEmail(baseRule, makeEmail())).toBe(false);
  });

  it("matches a contains condition on from", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "from", operator: "contains", value: "alice" }],
    };
    expect(testRuleAgainstEmail(rule, makeEmail())).toBe(true);
  });

  it("is case-insensitive for contains", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "subject", operator: "contains", value: "HELLO" }],
    };
    expect(testRuleAgainstEmail(rule, makeEmail({ subject: "hello world" }))).toBe(true);
  });

  it("matches equals operator", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "subject", operator: "equals", value: "hello world" }],
    };
    expect(testRuleAgainstEmail(rule, makeEmail({ subject: "Hello World" }))).toBe(true);
    expect(testRuleAgainstEmail(rule, makeEmail({ subject: "hello" }))).toBe(false);
  });

  it("matches startsWith and endsWith", () => {
    const start: Filter = {
      ...baseRule,
      conditions: [{ field: "subject", operator: "startsWith", value: "hello" }],
    };
    const end: Filter = {
      ...baseRule,
      conditions: [{ field: "subject", operator: "endsWith", value: "world" }],
    };
    expect(testRuleAgainstEmail(start, makeEmail())).toBe(true);
    expect(testRuleAgainstEmail(end, makeEmail())).toBe(true);
    expect(testRuleAgainstEmail(start, makeEmail({ subject: "nope" }))).toBe(false);
  });

  it("matches greaterThan / lessThan on size", () => {
    const gt: Filter = {
      ...baseRule,
      conditions: [{ field: "size", operator: "greaterThan", value: "500" }],
    };
    const lt: Filter = {
      ...baseRule,
      conditions: [{ field: "size", operator: "lessThan", value: "500" }],
    };
    expect(testRuleAgainstEmail(gt, makeEmail({ size: 1000 }))).toBe(true);
    expect(testRuleAgainstEmail(gt, makeEmail({ size: 100 }))).toBe(false);
    expect(testRuleAgainstEmail(lt, makeEmail({ size: 100 }))).toBe(true);
  });

  it("matches hasAttachment boolean field", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "hasAttachment", operator: "equals", value: "true" }],
    };
    expect(testRuleAgainstEmail(rule, makeEmail({ hasAttachments: true }))).toBe(true);
    expect(testRuleAgainstEmail(rule, makeEmail({ hasAttachments: false }))).toBe(false);
  });

  it("matches regex via matches operator", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "subject", operator: "matches", value: "^hello" }],
    };
    expect(testRuleAgainstEmail(rule, makeEmail())).toBe(true);
    expect(testRuleAgainstEmail(rule, makeEmail({ subject: "nope" }))).toBe(false);
  });

  it("uses AND logic across multiple conditions", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [
        { field: "from", operator: "contains", value: "alice" },
        { field: "subject", operator: "contains", value: "hello" },
      ],
    };
    expect(testRuleAgainstEmail(rule, makeEmail())).toBe(true);
    expect(
      testRuleAgainstEmail(rule, makeEmail({ subject: "goodbye" })),
    ).toBe(false);
  });

  it("handles invalid regex gracefully (no throw)", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "subject", operator: "matches", value: "(" }],
    };
    expect(() => testRuleAgainstEmail(rule, makeEmail())).not.toThrow();
    expect(testRuleAgainstEmail(rule, makeEmail())).toBe(false);
  });
});

describe("filter engine — testRule over a list", () => {
  it("returns the subset of emails that match", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "from", operator: "contains", value: "alice" }],
    };
    const emails = [
      makeEmail({ id: "a", from: { name: "Alice", address: "alice@x.com" } }),
      makeEmail({ id: "b", from: { name: "Carol", address: "carol@x.com" } }),
    ];
    const matches = testRule(rule, emails);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("a");
  });
});

describe("filter engine — applyRules (simulate)", () => {
  it("applies markRead action to matching emails only", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "from", operator: "contains", value: "alice" }],
      actions: [{ type: "markRead", params: {} }],
    };
    const emails = [
      makeEmail({ id: "a", isRead: false, from: { name: "Alice", address: "alice@x.com" } }),
      makeEmail({ id: "b", isRead: false, from: { name: "Carol", address: "carol@x.com" } }),
    ];
    const result = applyRules([rule], emails);
    expect(result.find((e) => e.id === "a")?.isRead).toBe(true);
    expect(result.find((e) => e.id === "b")?.isRead).toBe(false);
  });

  it("applies label action by adding the label id", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "from", operator: "contains", value: "alice" }],
      actions: [{ type: "label", params: { labelId: "label-work" } }],
    };
    const result = applyRules([rule], [makeEmail({ id: "a" })]);
    expect(result[0].labels).toContain("label-work");
  });

  it("does not duplicate an existing label", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "from", operator: "contains", value: "alice" }],
      actions: [{ type: "label", params: { labelId: "label-work" } }],
    };
    const result = applyRules([rule], [makeEmail({ id: "a", labels: ["label-work"] })]);
    expect(result[0].labels.filter((l) => l === "label-work")).toHaveLength(1);
  });

  it("respects rule enabled flag (disabled rules are skipped)", () => {
    const rule: Filter = {
      ...baseRule,
      enabled: false,
      conditions: [{ field: "from", operator: "contains", value: "alice" }],
      actions: [{ type: "markRead", params: {} }],
    };
    const result = applyRules([rule], [makeEmail({ id: "a", isRead: false })]);
    expect(result[0].isRead).toBe(false);
  });

  it("applies move action to change folder", () => {
    const rule: Filter = {
      ...baseRule,
      conditions: [{ field: "from", operator: "contains", value: "alice" }],
      actions: [{ type: "move", params: { folder: "archive" } }],
    };
    const result = applyRules([rule], [makeEmail({ id: "a" })]);
    expect(result[0].folder).toBe("archive");
  });
});
