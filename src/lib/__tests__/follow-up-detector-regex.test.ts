/**
 * Test that all default rules compile to valid RegExp objects
 * and that the rule-promise-send pattern matches expected text.
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_RULES, detectFollowUps } from "@/lib/follow-up-detector";
import type { FollowUpEmailInput } from "@/types/follow-up";

describe("follow-up-detector regex validity", () => {
  it("all default rules compile to valid RegExp", () => {
    for (const rule of DEFAULT_RULES) {
      expect(() => new RegExp(rule.pattern, "gi")).not.toThrow();
    }
  });

  it("rule-promise-send matches promise text", () => {
    const rule = DEFAULT_RULES.find((r) => r.id === "rule-promise-send");
    expect(rule).toBeDefined();
    const re = new RegExp(rule!.pattern, "gi");
    expect(re.test("I'll send the report by Friday")).toBe(true);
    expect(re.test("I will send the data by Monday")).toBe(true);
    expect(re.test("I'll share the notes before the meeting")).toBe(true);
    expect(re.test("I'll get back to you soon")).toBe(false);
  });

  it("detectFollowUps works with promise rules on sent folder", () => {
    const emails: FollowUpEmailInput[] = [
      {
        id: "e1",
        threadId: "t1",
        folder: "sent",
        from: { name: "Me", address: "me@example.com" },
        subject: "Report",
        preview: "I'll send the report by Friday",
        body: "I'll send the report by Friday",
        date: new Date().toISOString(),
      },
    ];
    const items = detectFollowUps(emails);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].type).toBe("promise");
  });
});
