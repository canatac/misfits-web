/**
 * Email Composer Templates (Save & Reuse Common Messages)
 *
 * Allows users to save frequently used message templates
 * and quickly insert them when composing emails.
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export function createTemplate(name: string, subject: string, body: string): EmailTemplate {
  return {
    id: crypto.randomUUID(),
    name,
    subject,
    body,
    variables: extractVariables(body),
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

export function renderTemplate(template: EmailTemplate, values: Record<string, string>): { subject: string; body: string } {
  let { subject, body } = template;

  for (const [key, value] of Object.entries(values)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return { subject, body };
}

export function validateTemplate(template: EmailTemplate): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!template.name.trim()) errors.push('Template name is required');
  if (!template.body.trim()) errors.push('Template body is required');
  if (template.name.length > 100) errors.push('Name must be 100 characters or less');
  return { valid: errors.length === 0, errors };
}

export function toggleDefault(template: EmailTemplate): EmailTemplate {
  return { ...template, isDefault: !template.isDefault, updatedAt: Date.now() };
}

export function updateTemplate(template: EmailTemplate, updates: Partial<Pick<EmailTemplate, 'name' | 'subject' | 'body'>>): EmailTemplate {
  const updated = { ...template, ...updates, updatedAt: Date.now() };
  if (updates.body) {
    updated.variables = extractVariables(updates.body);
  }
  return updated;
}

export function getTemplatePreview(template: EmailTemplate, maxLength = 100): string {
  const cleanBody = template.body.replace(/\{\{(\w+)\}\}/g, '___').replace(/\s+/g, ' ').trim();
  return cleanBody.length > maxLength ? cleanBody.slice(0, maxLength) + '...' : cleanBody;
}

export function sortTemplates(templates: EmailTemplate[]): EmailTemplate[] {
  return [...templates].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return b.updatedAt - a.updatedAt;
  });
}
