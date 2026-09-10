import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createTemplate,
  deleteTemplate,
  findTemplateByName,
  readTemplates,
  updateTemplate,
  type EmailTemplate,
} from "@/stores/email-template-helpers";

const STORAGE_KEY = "misfits:email-templates";

function clearStorage() {
  window.localStorage.removeItem(STORAGE_KEY);
}

afterEach(() => {
  clearStorage();
});

describe("email-template-helpers", () => {
  it("returns empty array when no templates exist", () => {
    expect(readTemplates()).toEqual([]);
  });

  it("creates a template and reads it back", () => {
    const tmpl = createTemplate({
      name: "Follow-up",
      subject: "Following up",
      body: "<p>Hello</p>",
    });

    expect(tmpl.id).toMatch(/^tmpl-/);
    expect(tmpl.name).toBe("Follow-up");
    expect(tmpl.subject).toBe("Following up");
    expect(tmpl.body).toBe("<p>Hello</p>");
    expect(tmpl.createdAt).toBeTruthy();
    expect(tmpl.updatedAt).toBeTruthy();

    const all = readTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(tmpl.id);
  });

  it("sorts templates by updatedAt descending", () => {
    createTemplate({ name: "First", subject: "A", body: "a" });
    createTemplate({ name: "Second", subject: "B", body: "b" });
    createTemplate({ name: "Third", subject: "C", body: "c" });

    const all = readTemplates();
    expect(all.map((t) => t.name)).toEqual(["Third", "Second", "First"]);
  });

  it("updates an existing template", () => {
    const tmpl = createTemplate({
      name: "Original",
      subject: "Old",
      body: "old",
    });

    const updated = updateTemplate(tmpl.id, { subject: "New" });
    expect(updated).not.toBeNull();
    expect(updated?.subject).toBe("New");
    expect(updated?.name).toBe("Original");

    const all = readTemplates();
    expect(all[0].subject).toBe("New");
  });

  it("returns null when updating non-existent template", () => {
    const result = updateTemplate("nonexistent", { subject: "X" });
    expect(result).toBeNull();
  });

  it("deletes a template", () => {
    const tmpl = createTemplate({
      name: "ToDelete",
      subject: "X",
      body: "x",
    });
    expect(readTemplates()).toHaveLength(1);

    const deleted = deleteTemplate(tmpl.id);
    expect(deleted).toBe(true);
    expect(readTemplates()).toHaveLength(0);
  });

  it("returns false when deleting non-existent template", () => {
    expect(deleteTemplate("nonexistent")).toBe(false);
  });

  it("finds a template by name (case-insensitive)", () => {
    createTemplate({ name: "My Template", subject: "S", body: "b" });

    const found = findTemplateByName("my template");
    expect(found).toBeDefined();
    expect(found?.name).toBe("My Template");

    const notFound = findTemplateByName("nonexistent");
    expect(notFound).toBeUndefined();
  });

  it("replaces template with same name on create", () => {
    createTemplate({ name: "Dup", subject: "First", body: "1" });
    createTemplate({ name: "Dup", subject: "Second", body: "2" });

    const all = readTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].subject).toBe("Second");
  });
});
