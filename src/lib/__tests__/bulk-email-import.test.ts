
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

import { describe, it, expect } from "vitest";
import { 
  parseEmailCSV, 
  dedupeEntries, 
  validateImportEmail, 
  formatImportSummary,
  isMboxFormat,
  parseMbox,
  extractEmlSubject,
  extractEmlFrom,
  extractEmlDate,
  parseEmlBody,
  isEmailFile,
  getFileExtension,
} from "@/lib/bulk-email-import";

describe("parseEmailCSV", () => {
  it("with header", () => { const r = parseEmailCSV("email, name\nalice@example.com, Alice\nbob@test.org, Bob"); expect(r.total).toBe(2); expect(r.valid).toBe(2); expect(r.entries[0].email).toBe("alice@example.com"); expect(r.entries[0].name).toBe("Alice"); });
  it("without header", () => { const r = parseEmailCSV("alice@example.com, Alice"); expect(r.total).toBe(1); expect(r.valid).toBe(1); });
  it("invalid emails", () => { const r = parseEmailCSV("email\nbad-email\ngood@test.com"); expect(r.valid).toBe(1); expect(r.invalid).toBe(1); expect(r.errors[0].reason).toBe("Invalid email format"); });
  it("missing emails", () => { const r = parseEmailCSV("email\n, Name\nvalid@test.com"); expect(r.invalid).toBe(1); expect(r.errors[0].reason).toBe("Missing email"); });
  it("empty", () => { expect(parseEmailCSV("")).toEqual({total:0,valid:0,invalid:0,entries:[],errors:[]}); expect(parseEmailCSV("  \n  ")).toEqual({total:0,valid:0,invalid:0,entries:[],errors:[]}); });
  it("lowercase", () => { const r = parseEmailCSV("ALICE@EXAMPLE.COM"); expect(r.entries[0].email).toBe("alice@example.com"); });
});
describe("dedupeEntries", () => {
  it("dedupes", () => { const r = dedupeEntries([{email:"a@test.com",row:1,valid:true},{email:"a@test.com",row:2,valid:true},{email:"b@test.com",row:3,valid:true}]); expect(r).toHaveLength(2); expect(r[0].row).toBe(1); });
  it("filters invalid", () => { const r = dedupeEntries([{email:"a@test.com",row:1,valid:true},{email:"b@test.com",row:2,valid:false}]); expect(r).toHaveLength(1); });
});
describe("validateImportEmail", () => {
  it("good", () => { expect(validateImportEmail("user@test.com")).toEqual({valid:true}); });
  it("empty", () => { expect(validateImportEmail("")).toEqual({valid:false,reason:"Empty email"}); });
  it("invalid", () => { expect(validateImportEmail("not-email")).toEqual({valid:false,reason:"Invalid email format"}); });
  it("trim", () => { expect(validateImportEmail("  user@test.com  ")).toEqual({valid:true}); });
});
describe("formatImportSummary", () => {
  it("empty", () => { expect(formatImportSummary({total:0,valid:0,invalid:0,entries:[],errors:[]})).toBe("No entries found."); });
  it("success", () => { expect(formatImportSummary({total:10,valid:10,invalid:0,entries:[],errors:[]})).toBe("Imported 10 of 10 emails (0 invalid)."); });
  it("partial", () => { expect(formatImportSummary({total:5,valid:3,invalid:2,entries:[],errors:[]})).toBe("Imported 3 of 5 emails (2 invalid)."); });
});


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
