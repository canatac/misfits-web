import { describe, it, expect } from 'vitest';
import {
  isMboxFormat,
  parseMbox,
  extractEmlSubject,
  extractEmlFrom,
  extractEmlDate,
  parseEmlBody,
  isEmailFile,
  getFileExtension,
} from '../bulk-email-import';

describe('bulk-email-import', () => {
  describe('isMboxFormat', () => {
    it('detects mbox format', () => {
      const mbox = 'From user@example.com Mon Jan 01 2024 10:00:00 GMT\nSubject: Test\n\nBody';
      expect(isMboxFormat(mbox)).toBe(true);
    });

    it('returns false for non-mbox', () => {
      const eml = 'Subject: Test\nFrom: user@example.com\n\nBody';
      expect(isMboxFormat(eml)).toBe(false);
    });
  });

  describe('parseMbox', () => {
    it('splits mbox into individual messages', () => {
      const mbox = [
        'From a@test.com Mon Jan 01 2024',
        'Subject: First',
        '',
        'Body 1',
        'From b@test.com Mon Jan 02 2024',
        'Subject: Second',
        '',
        'Body 2',
      ].join('\n');
      const messages = parseMbox(mbox);
      expect(messages).toHaveLength(2);
    });

    it('handles single message', () => {
      const mbox = 'From a@test.com Mon Jan 01 2024\nSubject: Test\n\nBody';
      expect(parseMbox(mbox)).toHaveLength(1);
    });
  });

  describe('extractEmlSubject', () => {
    it('extracts subject', () => {
      const eml = 'Subject: Hello World\nFrom: a@test.com\n\nBody';
      expect(extractEmlSubject(eml)).toBe('Hello World');
    });

    it('returns default when no subject', () => {
      expect(extractEmlSubject('From: a@test.com\n\nBody')).toBe('(no subject)');
    });
  });

  describe('extractEmlFrom', () => {
    it('extracts from', () => {
      const eml = 'From: sender@test.com\nSubject: Test\n\nBody';
      expect(extractEmlFrom(eml)).toBe('sender@test.com');
    });
  });

  describe('extractEmlDate', () => {
    it('extracts valid date', () => {
      const eml = 'Date: Mon, 1 Jan 2024 10:00:00 +0000\nSubject: Test\n\nBody';
      const date = extractEmlDate(eml);
      expect(date).toBeInstanceOf(Date);
    });

    it('returns null for invalid date', () => {
      const eml = 'Date: invalid\nSubject: Test\n\nBody';
      expect(extractEmlDate(eml)).toBeNull();
    });
  });

  describe('parseEmlBody', () => {
    it('extracts body after headers', () => {
      const eml = 'Subject: Test\nFrom: a@test.com\n\nThis is the body';
      expect(parseEmlBody(eml)).toBe('This is the body');
    });
  });

  describe('isEmailFile', () => {
    it('accepts .eml', () => {
      expect(isEmailFile('test.eml')).toBe(true);
    });

    it('accepts .mbox', () => {
      expect(isEmailFile('archive.mbox')).toBe(true);
    });

    it('rejects .pdf', () => {
      expect(isEmailFile('doc.pdf')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('returns lowercase extension', () => {
      expect(getFileExtension('test.EML')).toBe('eml');
    });

    it('returns empty for no extension', () => {
      expect(getFileExtension('test')).toBe('');
    });
  });
});
