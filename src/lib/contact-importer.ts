/**
 * Contact Importer (from email history / vCard / CSV)
 *
 * Imports contacts from multiple sources:
 * - Email history (extract unique senders)
 * - vCard (.vcf) files
 * - CSV files with name/email columns
 */

export interface Contact {
  id: string;
  name: string;
  email: string;
  source: 'email-history' | 'vcard' | 'csv';
  importedAt: number;
}

export interface ImportSummary {
  total: number;
  imported: number;
  duplicates: number;
  errors: string[];
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function parseVCard(content: string): Contact[] {
  const contacts: Contact[] = [];
  const cards = content.split('BEGIN:VCARD').slice(1);

  for (const card of cards) {
    const nameMatch = card.match(/FN[:;]+(.+)/i);
    const emailMatch = card.match(/EMAIL[;:=]+(.+)/i);

    if (emailMatch) {
      contacts.push({
        id: crypto.randomUUID(),
        name: nameMatch?.[1]?.trim() || emailMatch[1].trim(),
        email: emailMatch[1].trim().toLowerCase(),
        source: 'vcard',
        importedAt: Date.now(),
      });
    }
  }

  return contacts;
}

export function parseCSV(content: string): Contact[] {
  const contacts: Contact[] = [];
  const lines = content.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) return contacts;

  const header = lines[0].toLowerCase();
  const emailIdx = header.split(/[,;\t]/).findIndex(c => c.includes('email') || c.includes('e-mail'));
  const nameIdx = header.split(/[,;\t]/).findIndex(c => c.includes('name') || c.includes('display'));

  const startRow = emailIdx === -1 && nameIdx === -1 ? 0 : 1;

  for (let i = startRow; i < lines.length; i++) {
    const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
    const email = cols[emailIdx !== -1 ? emailIdx : 1] || '';
    const name = cols[nameIdx !== -1 ? nameIdx : 0] || email;

    if (email && isValidEmail(email)) {
      contacts.push({
        id: crypto.randomUUID(),
        name: name || email,
        email: email.toLowerCase(),
        source: 'csv',
        importedAt: Date.now(),
      });
    }
  }

  return contacts;
}

export function extractFromEmails(emails: Array<{ from: string }>): Contact[] {
  const seen = new Set<string>();
  const contacts: Contact[] = [];

  for (const email of emails) {
    const match = email.from.match(/(.*)<(.+)>/);
    const name = match?.[1]?.trim() || match?.[2] || email.from;
    const addr = match?.[2] || email.from;
    const emailMatch = addr.match(EMAIL_RE);

    if (emailMatch) {
      const emailAddr = emailMatch[0].toLowerCase();
      if (!seen.has(emailAddr)) {
        seen.add(emailAddr);
        contacts.push({
          id: crypto.randomUUID(),
          name,
          email: emailAddr,
          source: 'email-history',
          importedAt: Date.now(),
        });
      }
    }
  }

  return contacts;
}

export function mergeContacts(existing: Contact[], incoming: Contact[]): ImportSummary {
  const existingEmails = new Set(existing.map(c => c.email));
  const summary: ImportSummary = {
    total: incoming.length,
    imported: 0,
    duplicates: 0,
    errors: [],
  };

  for (const contact of incoming) {
    if (existingEmails.has(contact.email)) {
      summary.duplicates++;
    } else {
      existing.push(contact);
      existingEmails.add(contact.email);
      summary.imported++;
    }
  }

  return summary;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
