/**
 * contact-importer.ts — CSV/vCard contact import parser.
 *
 * Parses raw CSV or vCard text into normalized Contact records, handling
 * common column-name aliases and deduplication by email.
 */

export interface Contact {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  company: string | null;
}

export interface ImportResult {
  contacts: Contact[];
  skipped: number;
  duplicates: number;
}

const EMAIL_ALIASES = ["email", "e-mail", "emailaddress", "mail"];
const FIRST_ALIASES = ["firstname", "first_name", "first name", "fname", "given"];
const LAST_ALIASES = ["lastname", "last_name", "last name", "lname", "surname", "family"];
const PHONE_ALIASES = ["phone", "tel", "mobile", "cell"];
const COMPANY_ALIASES = ["company", "org", "organization"];

function findColumn(headers: string[], aliases: string[]): number {
  const lowered = headers.map((h) => h.trim().toLowerCase());
  for (const a of aliases) {
    const idx = lowered.indexOf(a);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseCSV(text: string): string[][] {
  return text.split(/\r?\n/).filter(Boolean).map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
}

function validEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** Parse CSV text into contacts. First row = headers. */
export function parseCSVContacts(text: string): ImportResult {
  const rows = parseCSV(text);
  if (rows.length < 2) return { contacts: [], skipped: 0, duplicates: 0 };

  const headers = rows[0];
  const emailIdx = findColumn(headers, EMAIL_ALIASES);
  const firstIdx = findColumn(headers, FIRST_ALIASES);
  const lastIdx = findColumn(headers, LAST_ALIASES);
  const phoneIdx = findColumn(headers, PHONE_ALIASES);
  const companyIdx = findColumn(headers, COMPANY_ALIASES);

  const contacts: Contact[] = [];
  let skipped = 0;
  let duplicates = 0;
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const email = (row[emailIdx] ?? "").trim().toLowerCase();
    if (!validEmail(email)) { skipped++; continue; }
    if (seen.has(email)) { duplicates++; continue; }
    seen.add(email);
    contacts.push({
      email,
      firstName: firstIdx >= 0 ? row[firstIdx] : "",
      lastName: lastIdx >= 0 ? row[lastIdx] : "",
      phone: phoneIdx >= 0 ? row[phoneIdx] || null : null,
      company: companyIdx >= 0 ? row[companyIdx] || null : null,
    });
  }

  return { contacts, skipped, duplicates };
}
