import { describe, it, expect } from 'vitest';
import {
  createTemplate,
  extractVariables,
  renderTemplate,
  validateTemplate,
  toggleDefault,
  updateTemplate,
  getTemplatePreview,
  sortTemplates,
  type EmailTemplate,
} from '../email-composer-templates';

describe('email-composer-templates', () => {
  describe('createTemplate', () => {
    it('creates template with variables', () => {
      const tmpl = createTemplate('Welcome', 'Hi {{name}}', 'Hello {{name}}, welcome!');
      expect(tmpl.name).toBe('Welcome');
      expect(tmpl.variables).toContain('name');
      expect(tmpl.isDefault).toBe(false);
    });
  });

  describe('extractVariables', () => {
    it('finds variables', () => {
      expect(extractVariables('Hi {{name}}, your order {{orderId}} is ready.')).toEqual(['name', 'orderId']);
    });

    it('returns empty for no variables', () => {
      expect(extractVariables('No variables')).toEqual([]);
    });
  });

  describe('renderTemplate', () => {
    it('replaces variables', () => {
      const tmpl = createTemplate('Test', 'Hi {{name}}', 'Hello {{name}}');
      const result = renderTemplate(tmpl, { name: 'John' });
      expect(result.subject).toBe('Hi John');
      expect(result.body).toBe('Hello John');
    });
  });

  describe('validateTemplate', () => {
    it('validates empty name', () => {
      const tmpl = createTemplate('', 'Subject', 'Body');
      expect(validateTemplate(tmpl).valid).toBe(false);
    });
  });

  describe('toggleDefault', () => {
    it('toggles default flag', () => {
      const tmpl = createTemplate('Test', 'Subject', 'Body');
      expect(toggleDefault(tmpl).isDefault).toBe(true);
    });
  });

  describe('updateTemplate', () => {
    it('updates body and extracts variables', () => {
      const tmpl = createTemplate('Test', 'Subject', 'Old body');
      const updated = updateTemplate(tmpl, { body: 'Hello {{name}}' });
      expect(updated.variables).toContain('name');
    });
  });

  describe('getTemplatePreview', () => {
    it('truncates long bodies', () => {
      const tmpl = createTemplate('Test', 'Subject', 'A'.repeat(200));
      expect(getTemplatePreview(tmpl).length).toBeLessThanOrEqual(103);
    });
  });

  describe('sortTemplates', () => {
    it('puts default templates first', () => {
      const templates: EmailTemplate[] = [
        createTemplate('A', 'A', 'A'),
        createTemplate('B', 'B', 'B'),
        createTemplate('C', 'C', 'C'),
      ];
      templates[2].isDefault = true;
      const sorted = sortTemplates(templates);
      expect(sorted[0].name).toBe('C');
    });
  });
});
