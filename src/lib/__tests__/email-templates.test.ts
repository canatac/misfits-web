import { describe, expect, it } from "vitest";
import {
  applyTemplate,
  emailTemplates,
  type EmailTemplate,
} from "../email-templates";

const tpl: EmailTemplate = {
  id: "test",
  name: "Test",
  subject: "Hello {{name}}",
  body: "<p>Hi {{name}}, welcome to {{product}}</p>",
  category: "onboarding",
  description: "Test template",
};

describe("applyTemplate", () => {
  it("replaces all placeholders in subject and body", () => {
    const result = applyTemplate(tpl, { name: "Alice", product: "misfits" });
    expect(result.subject).toBe("Hello Alice");
    expect(result.body).toBe("<p>Hi Alice, welcome to misfits</p>");
  });

  it("keeps placeholder when variable missing", () => {
    const result = applyTemplate(tpl, { name: "Bob" });
    expect(result.subject).toBe("Hello Bob");
    expect(result.body).toContain("{{product}}");
  });

  it("handles empty vars object", () => {
    const result = applyTemplate(tpl, {});
    expect(result.subject).toBe("Hello {{name}}");
  });

  it("does not mutate original template", () => {
    applyTemplate(tpl, { name: "X", product: "Y" });
    expect(tpl.subject).toBe("Hello {{name}}");
    expect(tpl.body).toContain("{{name}}");
  });
});

describe("emailTemplates", () => {
  it("has 5 built-in templates", () => {
    expect(emailTemplates).toHaveLength(5);
  });

  it("each has required fields", () => {
    for (const t of emailTemplates) {
      expect(t.id).toMatch(/^tpl-/);
      expect(t.name).toBeTruthy();
      expect(t.subject).toBeTruthy();
      expect(t.body).toBeTruthy();
      expect(t.category).toMatch(/onboarding|meeting|follow-up|billing|marketing/);
    }
  });

  it("has unique ids", () => {
    const ids = emailTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
