/**
 * Email template store and management (Issue #519).
 *
 * Provides CRUD operations for email templates, template selection,
 * and integration with the composer for save/reuse functionality.
 */

export interface UserTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "personal" | "shared";
  createdAt: string;
  updatedAt: string;
  variables: string[];
}

export interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  category?: "personal" | "shared";
}

export interface TemplateValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Create a new user template.
 */
export function createUserTemplate(data: TemplateFormData): UserTemplate {
  const now = new Date().toISOString();
  return {
    id: `tpl-${Date.now()}`,
    name: data.name,
    subject: data.subject,
    body: data.body,
    category: data.category || "personal",
    createdAt: now,
    updatedAt: now,
    variables: extractVariables(data.subject, data.body),
  };
}

/**
 * Update an existing template.
 */
export function updateUserTemplate(
  template: UserTemplate,
  data: Partial<TemplateFormData>
): UserTemplate {
  return {
    ...template,
    ...data,
    updatedAt: new Date().toISOString(),
    variables: extractVariables(
      data.subject || template.subject,
      data.body || template.body
    ),
  };
}

/**
 * Delete a template by ID.
 */
export function deleteTemplate(templates: UserTemplate[], id: string): UserTemplate[] {
  return templates.filter((t) => t.id !== id);
}

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(
  templates: UserTemplate[],
  category: "personal" | "shared"
): UserTemplate[] {
  return templates.filter((t) => t.category === category);
}

/**
 * Search templates by name or subject.
 */
export function searchTemplates(templates: UserTemplate[], query: string): UserTemplate[] {
  const lower = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.subject.toLowerCase().includes(lower)
  );
}

/**
 * Extract variables from subject and body.
 */
export function extractVariables(subject: string, body: string): string[] {
  const vars = new Set<string>();
  const regex = /\{\{(\w+)\}\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(subject)) !== null) {
    vars.add(match[1]);
  }
  while ((match = regex.exec(body)) !== null) {
    vars.add(match[1]);
  }

  return Array.from(vars);
}

/**
 * Validate template form data.
 */
export function validateTemplate(data: TemplateFormData): TemplateValidation {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push("Template name is required");
  }

  if (!data.subject.trim()) {
    errors.push("Subject is required");
  }

  if (!data.body.trim()) {
    errors.push("Body is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get template by ID.
 */
export function getTemplateById(
  templates: UserTemplate[],
  id: string
): UserTemplate | undefined {
  return templates.find((t) => t.id === id);
}

/**
 * Sort templates by name.
 */
export function sortTemplatesByName(templates: UserTemplate[]): UserTemplate[] {
  return [...templates].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Sort templates by date (newest first).
 */
export function sortTemplatesByDate(templates: UserTemplate[]): UserTemplate[] {
  return [...templates].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get template count by category.
 */
export function getTemplateCounts(templates: UserTemplate[]): {
  total: number;
  personal: number;
  shared: number;
} {
  return {
    total: templates.length,
    personal: templates.filter((t) => t.category === "personal").length,
    shared: templates.filter((t) => t.category === "shared").length,
  };
}

/**
 * Create a template from an existing email.
 */
export function createTemplateFromEmail(options: {
  name: string;
  subject: string;
  body: string;
  category?: "personal" | "shared";
}): UserTemplate {
  return createUserTemplate({
    name: options.name,
    subject: options.subject,
    body: options.body,
    category: options.category,
  });
}
