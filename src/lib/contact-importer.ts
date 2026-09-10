/**
 * Contact Importer (Issue #473).
 *
 * Import contacts from email history, vCard files, or CSV exports.
 * Supports duplicate detection and progress tracking.
 */

export interface ContactImportEntry {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: "email_history" | "vcard" | "csv" | "manual";
  importedAt: string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  duplicates: number;
  errors: number;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface DuplicateContact {
  existing: ContactImportEntry;
  incoming: ContactImportEntry;
  matchField: "email" | "name" | "phone";
}

/**
 * Extract contacts from email history.
 */
export function extractContactsFromEmails(emails: Array<{
  from: { name: string; address: string };
  to: Array<{ name: string; address: string }>;
}>): ContactImportEntry[] {
  const contacts = new Map<string, ContactImportEntry>();

  for (const email of emails) {
    const fromEntry: ContactImportEntry = {
      name: email.from.name,
      email: email.from.address.toLowerCase(),
      source: "email_history",
      importedAt: new Date().toISOString(),
    };

    if (!contacts.has(fromEntry.email)) {
      contacts.set(fromEntry.email, fromEntry);
    }

    for (const to of email.to) {
      const toEntry: ContactImportEntry = {
        name: to.name,
        email: to.address.toLowerCase(),
        source: "email_history",
        importedAt: new Date().toISOString(),
      };

      if (!contacts.has(toEntry.email)) {
        contacts.set(toEntry.email, toEntry);
      }
    }
  }

  return Array.from(contacts.values());
}

/**
 * Parse vCard data into contacts.
 */
export function parseVCard(vcardData: string): ContactImportEntry[] {
  const contacts: ContactImportEntry[] = [];
  const cards = vcardData.split("BEGIN:VCARD").slice(1);

  for (const card of cards) {
    const name = card.match(/FN:(.*)/i)?.[1]?.trim() || "";
    const email = card.match(/EMAIL[^:]*:(.*)/i)?.[1]?.trim().toLowerCase() || "";
    const phone = card.match(/TEL[^:]*:(.*)/i)?.[1]?.trim();
    const org = card.match(/ORG:(.*)/i)?.[1]?.trim();

    if (email) {
      contacts.push({
        name,
        email,
        phone,
        company: org,
        source: "vcard",
        importedAt: new Date().toISOString(),
      });
    }
  }

  return contacts;
}

/**
 * Parse CSV data into contacts.
 */
export function parseCSV(csvData: string): ContactImportEntry[] {
  const contacts: ContactImportEntry[] = [];
  const lines = csvData.split("\n").filter((l) => l.trim());

  if (lines.length < 2) return contacts;

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const emailIdx = headers.indexOf("email");
  const phoneIdx = headers.indexOf("phone");
  const companyIdx = headers.indexOf("company");

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());

    const email = values[emailIdx]?.toLowerCase();
    if (!email) continue;

    contacts.push({
      name: values[nameIdx] || "",
      email,
      phone: values[phoneIdx],
      company: values[companyIdx],
      source: "csv",
      importedAt: new Date().toISOString(),
    });
  }

  return contacts;
}

/**
 * Detect duplicates in imported contacts.
 */
export function detectDuplicates(
  existing: ContactImportEntry[],
  incoming: ContactImportEntry[]
): DuplicateContact[] {
  const duplicates: DuplicateContact[] = [];

  for (const inc of incoming) {
    for (const ext of existing) {
      if (inc.email === ext.email) {
        duplicates.push({ existing: ext, incoming: inc, matchField: "email" });
        break;
      }
      if (inc.name && inc.name === ext.name) {
        duplicates.push({ existing: ext, incoming: inc, matchField: "name" });
        break;
      }
    }
  }

  return duplicates;
}

/**
 * Merge duplicates (keep existing, skip incoming).
 */
export function mergeDuplicates(
  existing: ContactImportEntry[],
  incoming: ContactImportEntry[]
): ContactImportEntry[] {
  const existingEmails = new Set(existing.map((c) => c.email));
  const uniqueIncoming = incoming.filter((c) => !existingEmails.has(c.email));
  return [...existing, ...uniqueIncoming];
}

/**
 * Create import progress tracker.
 */
export function createImportProgress(total: number): ImportProgress {
  return {
    total,
    processed: 0,
    duplicates: 0,
    errors: 0,
    status: "pending",
  };
}

/**
 * Update import progress.
 */
export function updateImportProgress(
  progress: ImportProgress,
  processed: number,
  duplicates: number = 0,
  errors: number = 0
): ImportProgress {
  return {
    ...progress,
    processed,
    duplicates,
    errors,
    status: processed >= progress.total ? "completed" : "processing",
  };
}

/**
 * Validate email format for import.
 */
export function isValidImportEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Filter invalid contacts.
 */
export function filterValidContacts(contacts: ContactImportEntry[]): ContactImportEntry[] {
  return contacts.filter((c) => isValidImportEmail(c.email));
}

/**
 * Get unique contacts by email.
 */
export function getUniqueContacts(contacts: ContactImportEntry[]): ContactImportEntry[] {
  const seen = new Set<string>();
  return contacts.filter((c) => {
    if (seen.has(c.email)) return false;
    seen.add(c.email);
    return true;
  });
}

/**
 * Search contacts by name or email.
 */
export function searchContacts(contacts: ContactImportEntry[], query: string): ContactImportEntry[] {
  const lower = query.toLowerCase();
  return contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower)
  );
}
