/**
 * Unit tests for user template management.
 */
import { describe, it, expect } from "vitest";
import {
  createUserTemplate,
  updateUserTemplate,
  deleteTemplate,
  getTemplatesByCategory,
  searchTemplates,
  extractVariables,
  validateTemplate,
  getTemplateById,
  sortTemplatesByName,
  sortTemplatesByDate,
  getTemplateCounts,
  createTemplateFromEmail,
} from "@/lib/user-templates";
import type { UserTemplate } from "@/lib/user-templates";

function makeTemplate(overrides: Partial<UserTemplate> = {}): UserTemplate {
  return {
    id: "tpl-1",
    name: "Test Template",
    subject: "Hello {{name}}",
    body: "<p>Hi {{name}},</p>",
    category: "personal",
    createdAt: "2026-09-10T12:00:00Z",
    updatedAt: "2026-09-10T12:00:00Z",
    variables: ["name"],
    ...overrides,
  };
}

describe("user-templates", () => {
  describe("createUserTemplate", () => {
    it("creates template with all fields", () => {
      const template = createUserTemplate({
        name: "Welcome",
        subject: "Welcome {{name}}",
        body: "<p>Hello</p>",
      });
      expect(template.id).toBeDefined();
      expect(template.name).toBe("Welcome");
      expect(template.category).toBe("personal");
      expect(template.variables).toContain("name");
    });

    it("defaults to personal category", () => {
      const template = createUserTemplate({
        name: "Test",
        subject: "Test",
        body: "Test",
      });
      expect(template.category).toBe("personal");
    });
  });

  describe("updateUserTemplate", () => {
    it("updates fields", () => {
      const template = makeTemplate();
      const updated = updateUserTemplate(template, { name: "Updated" });
      expect(updated.name).toBe("Updated");
      expect(updated.updatedAt).not.toBe(template.updatedAt);
    });
  });

  describe("deleteTemplate", () => {
    it("removes template by id", () => {
      const templates = [makeTemplate({ id: "t1" }), makeTemplate({ id: "t2" })];
      const result = deleteTemplate(templates, "t1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t2");
    });
  });

  describe("getTemplatesByCategory", () => {
    it("filters by category", () => {
      const templates = [
        makeTemplate({ id: "t1", category: "personal" }),
        makeTemplate({ id: "t2", category: "shared" }),
      ];
      const personal = getTemplatesByCategory(templates, "personal");
      expect(personal).toHaveLength(1);
    });
  });

  describe("searchTemplates", () => {
    it("searches by name", () => {
      const templates = [
        makeTemplate({ name: "Welcome" }),
        makeTemplate({ name: "Follow-up" }),
      ];
      const result = searchTemplates(templates, "welcome");
      expect(result).toHaveLength(1);
    });

    it("searches by subject", () => {
      const templates = [makeTemplate({ subject: "Hello {{name}}" })];
      const result = searchTemplates(templates, "hello");
      expect(result).toHaveLength(1);
    });
  });

  describe("extractVariables", () => {
    it("extracts variables from subject and body", () => {
      const vars = extractVariables("Hello {{name}} from {{company}}", "<p>{{date}}</p>");
      expect(vars).toContain("name");
      expect(vars).toContain("company");
      expect(vars).toContain("date");
    });

    it("returns empty for no variables", () => {
      expect(extractVariables("Hello", "World")).toHaveLength(0);
    });
  });

  describe("validateTemplate", () => {
    it("passes with valid data", () => {
      const result = validateTemplate({
        name: "Test",
        subject: "Test",
        body: "Test",
      });
      expect(result.valid).toBe(true);
    });

    it("fails with empty name", () => {
      const result = validateTemplate({
        name: "",
        subject: "Test",
        body: "Test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Template name is required");
    });

    it("fails with empty subject", () => {
      const result = validateTemplate({
        name: "Test",
        subject: "",
        body: "Test",
      });
      expect(result.valid).toBe(false);
    });

    it("fails with empty body", () => {
      const result = validateTemplate({
        name: "Test",
        subject: "Test",
        body: "",
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("getTemplateById", () => {
    it("finds template by id", () => {
      const templates = [makeTemplate({ id: "t1" })];
      const found = getTemplateById(templates, "t1");
      expect(found).toBeDefined();
    });

    it("returns undefined for unknown id", () => {
      const templates = [makeTemplate()];
      const found = getTemplateById(templates, "unknown");
      expect(found).toBeUndefined();
    });
  });

  describe("sortTemplatesByName", () => {
    it("sorts alphabetically", () => {
      const templates = [
        makeTemplate({ id: "t1", name: "Zebra" }),
        makeTemplate({ id: "t2", name: "Apple" }),
      ];
      const sorted = sortTemplatesByName(templates);
      expect(sorted[0].name).toBe("Apple");
    });
  });

  describe("sortTemplatesByDate", () => {
    it("sorts by date newest first", () => {
      const templates = [
        makeTemplate({ id: "t1", updatedAt: "2026-09-01T12:00:00Z" }),
        makeTemplate({ id: "t2", updatedAt: "2026-09-10T12:00:00Z" }),
      ];
      const sorted = sortTemplatesByDate(templates);
      expect(sorted[0].id).toBe("t2");
    });
  });

  describe("getTemplateCounts", () => {
    it("counts by category", () => {
      const templates = [
        makeTemplate({ id: "t1", category: "personal" }),
        makeTemplate({ id: "t2", category: "personal" }),
        makeTemplate({ id: "t3", category: "shared" }),
      ];
      const counts = getTemplateCounts(templates);
      expect(counts.total).toBe(3);
      expect(counts.personal).toBe(2);
      expect(counts.shared).toBe(1);
    });
  });

  describe("createTemplateFromEmail", () => {
    it("creates template from email data", () => {
      const template = createTemplateFromEmail({
        name: "From Email",
        subject: "Re: {{topic}}",
        body: "<p>{{body}}</p>",
      });
      expect(template.name).toBe("From Email");
      expect(template.variables).toContain("topic");
    });
  });
});
