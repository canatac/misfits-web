/**
 * Unit tests for email template utilities.
 */
import { describe, it, expect } from "vitest";
import {
  emailTemplates,
  applyTemplate,
  extractTemplateVariables,
  getVariableDefault,
  applyTemplateWithDefaults,
  previewTemplate,
  DEFAULT_TEMPLATE_VARIABLES,
} from "@/lib/email-templates";
import type { EmailTemplate } from "@/lib/email-templates";

describe("email-templates", () => {
  describe("applyTemplate", () => {
    it("replaces variables in subject and body", () => {
      const template = emailTemplates[0]; // welcome template
      const result = applyTemplate(template, { name: "John" });
      expect(result.subject).toContain("John");
      expect(result.body).toContain("John");
    });

    it("keeps placeholder for missing variables", () => {
      const template = emailTemplates[0];
      const result = applyTemplate(template, {});
      expect(result.subject).toContain("{{name}}");
    });
  });

  describe("extractTemplateVariables", () => {
    it("extracts all variables from template", () => {
      const template = emailTemplates[1]; // meeting template
      const keys = extractTemplateVariables(template);
      expect(keys).toContain("name");
      expect(keys).toContain("topic");
      expect(keys).toContain("date");
      expect(keys).toContain("location");
      expect(keys).toContain("sender");
    });

    it("returns empty array for template without variables", () => {
      const template: EmailTemplate = {
        id: "test",
        name: "Test",
        subject: "Hello",
        body: "No variables",
        category: "onboarding",
        description: "Test",
      };
      expect(extractTemplateVariables(template)).toHaveLength(0);
    });
  });

  describe("getVariableDefault", () => {
    it("returns default for name", () => {
      expect(getVariableDefault("name")).toBe("there");
    });

    it("returns current date for date", () => {
      const result = getVariableDefault("date");
      expect(result).toBeDefined();
      expect(result).toMatch(/\w+, \w+ \d+/);
    });

    it("returns current month for month", () => {
      const result = getVariableDefault("month");
      expect(result).toBeDefined();
      expect(result).toMatch(/\w+ \d{4}/);
    });

    it("returns undefined for unknown variable", () => {
      expect(getVariableDefault("unknown")).toBeUndefined();
    });
  });

  describe("applyTemplateWithDefaults", () => {
    it("applies defaults for missing variables", () => {
      const template = emailTemplates[0]; // welcome template
      const result = applyTemplateWithDefaults(template, {});
      expect(result.subject).not.toContain("{{name}}");
      expect(result.subject).toContain("there");
    });

    it("uses provided values over defaults", () => {
      const template = emailTemplates[0];
      const result = applyTemplateWithDefaults(template, { name: "Alice" });
      expect(result.subject).toContain("Alice");
    });
  });

  describe("previewTemplate", () => {
    it("returns preview with sample data", () => {
      const template = emailTemplates[1]; // meeting template
      const preview = previewTemplate(template);
      expect(preview.subject).not.toContain("{{");
      expect(preview.body).not.toContain("{{");
      expect(preview.body).toContain("Jane Smith");
    });
  });

  describe("DEFAULT_TEMPLATE_VARIABLES", () => {
    it("has all required variables", () => {
      const keys = DEFAULT_TEMPLATE_VARIABLES.map((v) => v.key);
      expect(keys).toContain("name");
      expect(keys).toContain("sender");
      expect(keys).toContain("date");
      expect(keys).toContain("topic");
      expect(keys).toContain("location");
      expect(keys).toContain("company");
    });
  });
});
