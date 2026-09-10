/**
 * Unit tests for Hermes AI email triage agent.
 */
import { describe, it, expect } from "vitest";
import {
  createTriageRule,
  updateTriageRule,
  enableRule,
  disableRule,
  deleteRule,
  getEnabledRules,
  emailMatchesConditions,
  applyActions,
  executeRules,
  createUndoEntry,
  getRuleStats,
  getActionLabel,
  getConditionLabel,
  parseNaturalLanguageRule,
} from "@/lib/triage-agent";

describe("triage-agent", () => {
  describe("createTriageRule", () => {
    it("creates rule with all fields", () => {
      const rule = createTriageRule({
        name: "Invoice Rule",
        description: "Label invoices",
        conditions: { subjectContains: ["invoice"] },
        actions: { labels: ["Finance"] },
      });
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe("Invoice Rule");
      expect(rule.enabled).toBe(true);
      expect(rule.executionCount).toBe(0);
    });
  });

  describe("updateTriageRule", () => {
    it("updates rule fields", () => {
      const rule = createTriageRule({
        name: "Test",
        description: "Test",
        conditions: {},
        actions: {},
      });
      const updated = updateTriageRule(rule, { name: "Updated" });
      expect(updated.name).toBe("Updated");
    });
  });

  describe("enableRule", () => {
    it("enables disabled rule", () => {
      const rule = createTriageRule({
        name: "Test",
        description: "Test",
        conditions: {},
        actions: {},
      });
      rule.enabled = false;
      expect(enableRule(rule).enabled).toBe(true);
    });
  });

  describe("disableRule", () => {
    it("disables enabled rule", () => {
      const rule = createTriageRule({
        name: "Test",
        description: "Test",
        conditions: {},
        actions: {},
      });
      expect(disableRule(rule).enabled).toBe(false);
    });
  });

  describe("deleteRule", () => {
    it("removes rule by id", () => {
      const rules = [
        createTriageRule({ name: "R1", description: "Test", conditions: {}, actions: {} }),
        createTriageRule({ name: "R2", description: "Test", conditions: {}, actions: {} }),
      ];
      const result = deleteRule(rules, rules[0].id);
      expect(result).toHaveLength(1);
    });
  });

  describe("getEnabledRules", () => {
    it("returns only enabled rules sorted by priority", () => {
      const rules = [
        createTriageRule({ name: "R1", description: "Test", conditions: {}, actions: {}, priority: 1 }),
        createTriageRule({ name: "R2", description: "Test", conditions: {}, actions: {}, priority: 5 }),
      ];
      rules[0].enabled = false;
      const enabled = getEnabledRules(rules);
      expect(enabled).toHaveLength(1);
      expect(enabled[0].name).toBe("R2");
    });
  });

  describe("emailMatchesConditions", () => {
    const testEmail = {
      from: { address: "john@example.com", name: "John" },
      to: [{ address: "me@example.com", name: "Me" }],
      subject: "Invoice #123",
      body: "Please find attached invoice",
      hasAttachments: true,
      isRead: false,
      date: "2026-09-10T12:00:00Z",
      size: 1024,
    };

    it("matches from condition", () => {
      const result = emailMatchesConditions(testEmail, { from: ["john"] });
      expect(result).toBe(true);
    });

    it("matches subject condition", () => {
      const result = emailMatchesConditions(testEmail, { subjectContains: ["invoice"] });
      expect(result).toBe(true);
    });

    it("matches body condition", () => {
      const result = emailMatchesConditions(testEmail, { bodyContains: ["attached"] });
      expect(result).toBe(true);
    });

    it("matches attachment condition", () => {
      const result = emailMatchesConditions(testEmail, { hasAttachment: true });
      expect(result).toBe(true);
    });

    it("matches unread condition", () => {
      const result = emailMatchesConditions(testEmail, { isUnread: true });
      expect(result).toBe(true);
    });

    it("does not match wrong condition", () => {
      const result = emailMatchesConditions(testEmail, { from: ["unknown"] });
      expect(result).toBe(false);
    });
  });

  describe("applyActions", () => {
    it("applies all actions", () => {
      const rule = createTriageRule({
        name: "Test",
        description: "Test",
        conditions: {},
        actions: { labels: ["Work"], archive: true, notify: true },
      });
      const result = applyActions(rule, "e1");
      expect(result.actionsApplied).toContain("label");
      expect(result.actionsApplied).toContain("archive");
      expect(result.actionsApplied).toContain("notify");
    });
  });

  describe("executeRules", () => {
    it("executes matching rules", () => {
      const rules = [
        createTriageRule({
          name: "Invoice",
          description: "Test",
          conditions: { subjectContains: ["invoice"] },
          actions: { labels: ["Finance"] },
        }),
      ];
      const email = {
        from: { address: "test@example.com", name: "Test" },
        to: [{ address: "me@example.com", name: "Me" }],
        subject: "Invoice #123",
        body: "Test",
        hasAttachments: false,
        isRead: false,
        date: "2026-09-10T12:00:00Z",
        size: 100,
      };
      const results = executeRules(rules, email);
      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(true);
    });
  });

  describe("createUndoEntry", () => {
    it("creates undo entry", () => {
      const rule = createTriageRule({
        name: "Test",
        description: "Test",
        conditions: {},
        actions: { labels: ["Work"] },
      });
      const result = applyActions(rule, "e1");
      const undo = createUndoEntry(result, { labels: [] });
      expect(undo.resultId).toBeDefined();
      expect(undo.undoneAt).toBeDefined();
    });
  });

  describe("getRuleStats", () => {
    it("returns stats", () => {
      const rule = createTriageRule({
        name: "Test",
        description: "Test",
        conditions: {},
        actions: {},
      });
      const stats = getRuleStats(rule);
      expect(stats.executionCount).toBe(0);
      expect(stats.enabled).toBe(true);
    });
  });

  describe("getActionLabel", () => {
    it("returns correct labels", () => {
      expect(getActionLabel("label")).toBe("Apply label");
      expect(getActionLabel("archive")).toBe("Archive");
    });
  });

  describe("getConditionLabel", () => {
    it("returns correct labels", () => {
      expect(getConditionLabel("from")).toBe("From");
      expect(getConditionLabel("subject")).toBe("Subject contains");
    });
  });

  describe("parseNaturalLanguageRule", () => {
    it("parses invoice rule", () => {
      const result = parseNaturalLanguageRule("Label invoices and move to Finance");
      expect(result.conditions.subjectContains).toContain("invoice");
    });

    it("parses newsletter rule", () => {
      const result = parseNaturalLanguageRule("Archive newsletters");
      expect(result.actions.archive).toBe(true);
    });
  });
});
