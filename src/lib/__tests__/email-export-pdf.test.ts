import { describe, it, expect, vi } from 'vitest';
import {
  generatePrintHtml,
  printEmail,
  generateFilename,
  type ExportData,
} from '../email-export-pdf';

describe('email-export-pdf', () => {
  const sampleData: ExportData = {
    subject: 'Test Subject',
    from: 'sender@test.com',
    to: 'receiver@test.com',
    date: '2024-01-01',
    body: '<p>Hello world</p>',
    attachments: [{ name: 'file.pdf', size: 1024000 }],
  };

  describe('generatePrintHtml', () => {
    it('generates headers when includeHeaders is true', () => {
      const html = generatePrintHtml(sampleData);
      expect(html).toContain('From:');
      expect(html).toContain('sender@test.com');
      expect(html).toContain('To:');
      expect(html).toContain('receiver@test.com');
    });

    it('omits headers when includeHeaders is false', () => {
      const html = generatePrintHtml(sampleData, { includeHeaders: false });
      expect(html).not.toContain('From:');
    });

    it('includes attachments', () => {
      const html = generatePrintHtml(sampleData, { includeAttachments: true });
      expect(html).toContain('file.pdf');
    });

    it('escapes HTML in headers', () => {
      const dataWithHtml: ExportData = { ...sampleData, subject: 'Test <script>alert(1)</script>' };
      const html = generatePrintHtml(dataWithHtml);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('printEmail', () => {
    it('opens print window', () => {
      // jsdom doesn't support window.open, so mock it
      const mockWindow = {
        document: { write: vi.fn(), close: vi.fn() },
        print: vi.fn(),
      };
      const originalOpen = window.open;
      (window as any).open = vi.fn().mockReturnValue(mockWindow);

      printEmail('<p>Test</p>');

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockWindow.document.write).toHaveBeenCalled();
      expect(mockWindow.print).toHaveBeenCalled();

      (window as any).open = originalOpen;
    });
  });

  describe('generateFilename', () => {
    it('generates clean filename', () => {
      const filename = generateFilename(sampleData);
      expect(filename).toContain('Test_Subject');
      expect(filename).toMatch(/^email_.*_\d+$/);
    });

    it('truncates long subjects', () => {
      const longSubject: ExportData = { ...sampleData, subject: 'A'.repeat(100) };
      const filename = generateFilename(longSubject);
      expect(filename.length).toBeLessThanOrEqual(70);
    });
  });
});
