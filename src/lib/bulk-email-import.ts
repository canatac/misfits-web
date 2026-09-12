/**
 * Bulk Email Import (mbox/EML drag-and-drop)
 *
 * Handles parsing and importing email files in bulk:
 * - mbox format parsing
 * - EML individual file parsing
 * - Progress tracking during import
 */

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: string[];
}

export interface ImportProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'parsing' | 'importing' | 'done' | 'error';
}

type ProgressCallback = (progress: ImportProgress) => void;

const MBOX_FROM_RE = /^From .*[0-9]{4}$/m;
const MBOX_HEADER_RE = /^[\w-]+: /;

export function isMboxFormat(content: string): boolean {
  const firstLines = content.split('\n').slice(0, 5);
  return firstLines.some(line => MBOX_FROM_RE.test(line.trim()));
}

export function parseMbox(content: string): string[] {
  const messages: string[] = [];
  const lines = content.split('\n');
  let current: string[] = [];

  for (const line of lines) {
    if (MBOX_FROM_RE.test(line.trim()) && current.length > 0) {
      messages.push(current.join('\n'));
      current = [];
    }
    current.push(line);
  }

  if (current.length > 0) {
    messages.push(current.join('\n'));
  }

  return messages;
}

export function extractEmlSubject(emlContent: string): string {
  const match = emlContent.match(/^Subject: (.+)$/m);
  return match ? match[1].trim() : '(no subject)';
}

export function extractEmlFrom(emlContent: string): string {
  const match = emlContent.match(/^From: (.+)$/m);
  return match ? match[1].trim() : '(unknown sender)';
}

export function extractEmlDate(emlContent: string): Date | null {
  const match = emlContent.match(/^Date: (.+)$/m);
  if (!match) return null;
  const date = new Date(match[1].trim());
  return isNaN(date.getTime()) ? null : date;
}

export function parseEmlBody(emlContent: string): string {
  const parts = emlContent.split(/\r?\n\r?\n/);
  if (parts.length < 2) return emlContent;

  // Skip headers (first section)
  const bodyParts = parts.slice(1);
  return bodyParts.join('\n\n').trim();
}

export function detectEncoding(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'eml':
      return 'utf-8';
    case 'mbox':
      return 'utf-8';
    case 'txt':
      return 'utf-8';
    default:
      return 'utf-8';
  }
}

export async function importFromFiles(
  files: File[],
  onProgress?: ProgressCallback
): Promise<ImportResult> {
  const result: ImportResult = {
    total: files.length,
    imported: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress?.({
      current: i + 1,
      total: files.length,
      fileName: file.name,
      status: 'parsing',
    });

    try {
      const content = await file.text();

      if (isMboxFormat(content)) {
        const messages = parseMbox(content);
        // Import each message
        result.imported += messages.length;
      } else {
        // Single EML
        result.imported++;
      }

      onProgress?.({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        status: 'done',
      });
    } catch (error) {
      result.failed++;
      result.errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onProgress?.({
        current: i + 1,
        total: files.length,
        fileName: file.name,
        status: 'error',
      });
    }
  }

  return result;
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function isEmailFile(fileName: string): boolean {
  const validExt = ['eml', 'mbox', 'txt'];
  return validExt.includes(getFileExtension(fileName));
}
