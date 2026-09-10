/**
 * Helpers for email templates persisted to localStorage.
 *
 * Templates capture subject + body (HTML) so they can be reused as
 * starting points for new emails.
 */
import { nowISO } from "./composer-store-helpers";

export const TEMPLATES_STORAGE_KEY = "misfits:email-templates";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateInput {
  name: string;
  subject: string;
  body: string;
}

function uid(prefix = "tmpl"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Read all templates from localStorage, sorted by updatedAt desc. */
export function readTemplates(): EmailTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EmailTemplate[];
    return parsed.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

/** Persist the full template list to localStorage. */
function writeTemplates(templates: EmailTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore quota / serialization errors
  }
}

/** Create a new template; returns the created template. */
export function createTemplate(input: TemplateInput): EmailTemplate {
  const now = nowISO();
  const template: EmailTemplate = {
    id: uid(),
    name: input.name,
    subject: input.subject,
    body: input.body,
    createdAt: now,
    updatedAt: now,
  };
  const existing = readTemplates().filter((t) => t.name !== input.name);
  writeTemplates([template, ...existing]);
  return template;
}

/** Update an existing template by id. */
export function updateTemplate(
  id: string,
  patch: Partial<TemplateInput>
): EmailTemplate | null {
  const templates = readTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: EmailTemplate = {
    ...templates[idx],
    ...patch,
    updatedAt: nowISO(),
  };
  templates[idx] = updated;
  writeTemplates(templates);
  return updated;
}

/** Delete a template by id. */
export function deleteTemplate(id: string): boolean {
  const templates = readTemplates();
  const next = templates.filter((t) => t.id !== id);
  if (next.length === templates.length) return false;
  writeTemplates(next);
  return true;
}

/** Find a template by name (case-insensitive). */
export function findTemplateByName(name: string): EmailTemplate | undefined {
  return readTemplates().find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );
}
