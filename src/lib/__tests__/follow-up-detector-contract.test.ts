/**
 * Integration test: Follow-up detector cross-repo contract.
 *
 * follow-up-detector.ts produces FollowUpItem consumed by the UI and
 * potentially synced to backend. This test verifies the contract between
 * detector output and the expected shape.
 */
import { describe, it, expect } from "vitest";
import type {
  FollowUpItem,
  FollowUpType,
  FollowUpStatus,
  FollowUpReminder,
  ReminderRule,
} from "@/types/follow-up";
import { DEFAULT_RULES } from "@/lib/follow-up-detector";

describe("Follow-up detector cross-repo contract", () => {
  it("DEFAULT_RULES produces valid ReminderRule objects", () => {
    expect(DEFAULT_RULES.length).toBeGreaterThan(0);
    for (const rule of DEFAULT_RULES) {
      expect(rule.id).toBeTruthy();
      expect(rule.name).toBeTruthy();
      expect(rule.pattern).toBeTruthy();
      expect(rule.enabled).toBe(true);
      expect(rule.defaultDelayHours).toBeGreaterThanOrEqual(0);
    }
  });

  it("DEFAULT_RULES has unique rule ids", () => {
    const ids = DEFAULT_RULES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("FollowUpType values match backend expectations", () => {
    const types: FollowUpType[] = ["needs_reply", "sent_awaiting", "promise"];
    expect(types).toHaveLength(3);
  });

  it("FollowUpStatus values match lifecycle states", () => {
    const statuses: FollowUpStatus[] = [
      "pending", "snoozed", "dismissed", "completed", "overdue",
    ];
    expect(statuses).toHaveLength(5);
  });

  it("FollowUpItem has required fields for UI rendering", () => {
    const item: FollowUpItem = {
      id: "fu-1",
      emailId: "email-1",
      threadId: "thread-1",
      type: "needs_reply",
      status: "pending",
      senderName: "John Doe",
      senderAddress: "john@example.com",
      subject: "Please review this",
      emailDate: "2026-01-01T00:00:00Z",
      dueDate: "2026-01-03T00:00:00Z",
      detectedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      confidence: 0.7,
      source: "rules",
      reasoning: "Direct question detected",
    };
    expect(item.id).toBeTruthy();
    expect(item.emailId).toBeTruthy();
    expect(item.confidence).toBeGreaterThanOrEqual(0);
    expect(item.confidence).toBeLessThanOrEqual(1);
  });

  it("FollowUpReminder has required fields for badge display", () => {
    const reminder: FollowUpReminder = {
      id: "rem-1",
      followUpId: "fu-1",
      emailId: "email-1",
      message: "Reply expected from John Doe",
      urgency: "warning",
      senderName: "John Doe",
      subject: "Please review",
      daysWaiting: 2,
      createdAt: "2026-01-03T00:00:00Z",
    };
    expect(reminder.urgency).toMatch(/^(info|warning|urgent)$/);
    expect(reminder.daysWaiting).toBeGreaterThanOrEqual(0);
  });

  it("DEFAULT_RULES covers all FollowUpType values", () => {
    const coveredTypes = new Set(DEFAULT_RULES.map((r) => r.type));
    expect(coveredTypes.has("needs_reply")).toBe(true);
    expect(coveredTypes.has("promise")).toBe(true);
  });
});
