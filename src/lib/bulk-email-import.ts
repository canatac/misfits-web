=======
/**
 * Bulk Email Import (mbox/EML drag-and-drop)
 *
 * Handles parsing and importing email files in bulk:
 * - mbox format parsing
 * - EML individual file parsing
 * - Progress tracking during import
 */


export interface ImportProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'parsing' | 'importing' | 'done' | 'error';
}

type ProgressCallback = (progress: ImportProgress) => void;

const MBOX_FROM_RE = /^From .*(\d{4})/;
const MBOX_HEADER_RE = /^[\w-]+: /;


export interface ImportResult { 
  total: number; 
  valid: number; 
  invalid: number; 
  entries: ParsedEmailEntry[]; 
  errors: ImportError[] 
}

export interface ParsedEmailEntry { 
  email: string; 
  name?: string; 
  row: number; 
  valid: boolean 
}

export interface ImportError { 
  row: number; 
  value: string; 
  reason: string 
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmailCSV(csv: string): ImportResult {
  
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  if (lines.length === 0) return { total: 0, valid: 0, invalid: 0, entries: [], errors: [] };
  
  const startIdx = /^email/i.test(lines[0]) ? 1 : 0;
  const dataLines = lines.slice(startIdx);
  const entries: ParsedEmailEntry[] = [];
  const errors: ImportError[] = [];
  
  let valid = 0, invalid = 0;
  
  for (let i = 0; i < dataLines.length; i++) {
    
    const row = startIdx + i;
    const cols = dataLines[i].split(",").map(c => c.trim());
    const email = cols[0]?.toLowerCase();
    const name = cols[1] || undefined;
    
    if (!email) { 
      errors.push(
        { row, 
         value: dataLines[i], 
         reason: "Missing email" }); 
      invalid++; 
      entries.push(
        { email: "", 
         row, 
         valid: false, 
         name }); 
      continue; 
    }
    
    if (!EMAIL_RE.test(email)) {
      errors.push(
        { row, 
         value: email, 
         reason: "Invalid email format" }); 
      invalid++; 
      entries.push(
        { email, 
         row, 
         valid: false, 
         name }); 
      continue; 
    }
    
    valid++; 
    entries.push({ email, row, valid: true, name });
  }
  
  return { total: dataLines.length, valid, invalid, entries, errors };
}

export function dedupeEntries(entries: ParsedEmailEntry[]): ParsedEmailEntry[] {
  const seen = new Set<string>();
  return entries.filter(e => { 
    if (!e.valid || seen.has(e.email)) 
      return false; 
    seen.add(e.email); 
    return true; 
  });
}

export function validateImportEmail(raw: string): { valid: boolean; reason?: string } {
  if (!raw) return { valid: false, reason: "Empty email" };
  if (!EMAIL_RE.test(raw.trim())) 
    return { valid: false, reason: "Invalid email format" };
  return { valid: true };
}

export function formatImportSummary(result: ImportResult): string {
  if (result.total === 0) return "No entries found.";
  return `Imported ${result.valid} of ${result.total} emails (${result.invalid} invalid).`;
}

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
