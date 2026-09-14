import { describe, it, expect } from 'vitest';
import {
  parseVCard,
  parseCSV,
  extractFromEmails,
  mergeContacts,
  type Contact,
} from '../contact-importer';

describe('contact-importer', () => {
  describe('parseVCard', () => {
    it('parses single vCard', () => {
      const vcf = 'BEGIN:VCARD\nFN:John Doe\nEMAIL:john@example.com\nEND:VCARD';
      const contacts = parseVCard(vcf);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].email).toBe('john@example.com');
      expect(contacts[0].name).toBe('John Doe');
    });

    it('parses multiple vCards', () => {
      const vcf = [
        'BEGIN:VCARD\nFN:John\nEMAIL:john@a.com\nEND:VCARD',
        'BEGIN:VCARD\nFN:Jane\nEMAIL:jane@b.com\nEND:VCARD',
      ].join('\n');
      expect(parseVCard(vcf)).toHaveLength(2);
    });

    it('uses email as name when FN missing', () => {
      const vcf = 'BEGIN:VCARD\nEMAIL:test@example.com\nEND:VCARD';
      const contacts = parseVCard(vcf);
      expect(contacts[0].name).toBe('test@example.com');
    });
  });

  describe('parseCSV', () => {
    it('parses CSV with headers', () => {
      const csv = 'name,email\nJohn,john@test.com\nJane,jane@test.com';
      const contacts = parseCSV(csv);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe('John');
    });

    it('skips invalid emails', () => {
      const csv = 'name,email\nTest,invalid-email\nGood,good@test.com';
      const contacts = parseCSV(csv);
      expect(contacts).toHaveLength(1);
    });
  });

  describe('extractFromEmails', () => {
    it('extracts unique senders', () => {
      const emails = [
        { from: 'John <john@a.com>' },
        { from: 'Jane <jane@b.com>' },
      ];
      const contacts = extractFromEmails(emails);
      expect(contacts).toHaveLength(2);
    });

    it('deduplicates senders', () => {
      const emails = [
        { from: 'John <john@a.com>' },
        { from: 'John <john@a.com>' },
      ];
      expect(extractFromEmails(emails)).toHaveLength(1);
    });
  });

  describe('mergeContacts', () => {
    it('counts duplicates', () => {
      const existing: Contact[] = [
        { id: '1', name: 'John', email: 'john@a.com', source: 'csv', importedAt: 0 },
      ];
      const incoming: Contact[] = [
        { id: '2', name: 'John', email: 'john@a.com', source: 'csv', importedAt: 0 },
      ];
      const summary = mergeContacts(existing, incoming);
      expect(summary.duplicates).toBe(1);
      expect(summary.imported).toBe(0);
    });

    it('counts new imports', () => {
      const existing: Contact[] = [];
      const incoming: Contact[] = [
        { id: '1', name: 'New', email: 'new@a.com', source: 'csv', importedAt: 0 },
      ];
      const summary = mergeContacts(existing, incoming);
      expect(summary.imported).toBe(1);
    });
  });
});
