export interface ImportResult { total: number; valid: number; invalid: number; entries: ParsedEmailEntry[]; errors: ImportError[] }
export interface ParsedEmailEntry { email: string; name?: string; row: number; valid: boolean }
export interface ImportError { row: number; value: string; reason: string }
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
    if (!email) { errors.push({ row, value: dataLines[i], reason: "Missing email" }); invalid++; entries.push({ email: "", row, valid: false, name }); continue; }
    if (!EMAIL_RE.test(email)) { errors.push({ row, value: email, reason: "Invalid email format" }); invalid++; entries.push({ email, row, valid: false, name }); continue; }
    valid++; entries.push({ email, row, valid: true, name });
  }
  return { total: dataLines.length, valid, invalid, entries, errors };
}
export function dedupeEntries(entries: ParsedEmailEntry[]): ParsedEmailEntry[] {
  const seen = new Set<string>();
  return entries.filter(e => { if (!e.valid || seen.has(e.email)) return false; seen.add(e.email); return true; });
}
export function validateImportEmail(raw: string): { valid: boolean; reason?: string } {
  if (!raw) return { valid: false, reason: "Empty email" };
  if (!EMAIL_RE.test(raw.trim())) return { valid: false, reason: "Invalid email format" };
  return { valid: true };
}
export function formatImportSummary(result: ImportResult): string {
  if (result.total === 0) return "No entries found.";
  return `Imported ${result.valid} of ${result.total} emails (${result.invalid} invalid).`;
}
