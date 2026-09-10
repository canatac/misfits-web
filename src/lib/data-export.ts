/**
 * Data export library — RGPD/NIS2 personal data portability.
 *
 * Exports user data in standard formats:
 * - Emails: mbox (RFC 4155)
 * - Contacts: vCard 4.0 (RFC 6350)
 * - Calendar: iCal (RFC 5545)
 */

import type { Email } from "@/types/email";
import type { Contact } from "@/types/contact";

/**
 * Escape a string for mbox format (escape "From " lines).
 */
export function escapeMbox(text: string): string {
  return text.replace(/^From /gm, ">From ");
}

/**
 * Format a date for mbox "From " line (Unix mbox format).
 */
function formatMboxDate(isoDate: string): string {
  const d = new Date(isoDate);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${String(d.getDate()).padStart(2, " ")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")} ${d.getFullYear()}`;
}

/**
 * Format an email address for mbox header.
 */
function formatAddress(name: string, address: string): string {
  if (name && name !== address) {
    return `"${name}" <${address}>`;
  }
  return address;
}

/**
 * Format addresses for mbox header.
 */
function formatAddresses(recipients: { name: string; address: string }[]): string {
  return recipients.map((r) => formatAddress(r.name, r.address)).join(", ");
}

/**
 * Export a single email to mbox format.
 */
export function emailToMbox(email: Email): string {
  const lines: string[] = [];
  lines.push(`From ${formatAddress(email.from.name, email.from.address)} ${formatMboxDate(email.date)}`);
  lines.push(`From: ${formatAddress(email.from.name, email.from.address)}`);
  lines.push(`To: ${formatAddresses(email.to)}`);
  if (email.cc && email.cc.length > 0) {
    lines.push(`Cc: ${formatAddresses(email.cc)}`);
  }
  lines.push(`Subject: ${email.subject}`);
  lines.push(`Date: ${new Date(email.date).toUTCString()}`);
  lines.push(`Message-ID: <${email.messageId}>`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: text/html; charset="UTF-8"`);
  lines.push("");
  lines.push(escapeMbox(email.body));
  lines.push("");
  return lines.join("\r\n");
}

/**
 * Export multiple emails to a single mbox file.
 */
export function emailsToMbox(emails: Email[]): string {
  return emails.map(emailToMbox).join("\r\n");
}

/**
 * Escape a string for vCard format.
 */
export function escapeVcard(text: string): string {
  return text.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
}

/**
 * Format a date for vCard (YYYYMMDDTHHMMSSZ).
 */
function formatVcardDate(isoDate: string): string {
  return new Date(isoDate).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Export a single contact to vCard 4.0 format.
 */
export function contactToVcard(contact: Contact): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:4.0");
  if (contact.name) {
    const parts = contact.name.split(" ");
    const family = parts.slice(1).join(" ");
    const given = parts[0] || "";
    lines.push(`N:${escapeVcard(family)};${escapeVcard(given)};;;`);
    lines.push(`FN:${escapeVcard(contact.name)}`);
  }
  if (contact.email) {
    lines.push(`EMAIL:${contact.email}`);
  }
  if (contact.phone) {
    lines.push(`TEL:${contact.phone}`);
  }
  if (contact.company) {
    lines.push(`ORG:${escapeVcard(contact.company)}`);
  }
  if (contact.notes) {
    lines.push(`NOTE:${escapeVcard(contact.notes)}`);
  }
  if (contact.createdAt) {
    lines.push(`REV:${formatVcardDate(contact.createdAt)}`);
  }
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/**
 * Export multiple contacts to a single vCard file (multiple vCards).
 */
export function contactsToVcard(contacts: Contact[]): string {
  return contacts.map(contactToVcard).join("\r\n\r\n");
}

/**
 * Escape a string for iCal format.
 */
export function escapeIcal(text: string): string {
  return text.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");
}

/**
 * Format a date for iCal (YYYYMMDDTHHMMSSZ).
 */
function formatIcalDate(isoDate: string): string {
  return new Date(isoDate).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Generate a unique ID for iCal events.
 */
function generateIcalUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}@misfits.ai`;
}

/**
 * Export calendar events to iCal format.
 */
export function calendarToIcal(events: Array<{
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
}>): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//misfits.ai//Mail//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id || generateIcalUid()}`);
    lines.push(`DTSTAMP:${formatIcalDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${formatIcalDate(event.startDate)}`);
    if (event.endDate) {
      lines.push(`DTEND:${formatIcalDate(event.endDate)}`);
    }
    lines.push(`SUMMARY:${escapeIcal(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcal(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcal(event.location)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Generate a filename for the export.
 */
export function generateExportFilename(format: "mbox" | "vcard" | "ical"): string {
  const date = new Date().toISOString().slice(0, 10);
  const ext = format === "mbox" ? "mbox" : format === "vcard" ? "vcf" : "ics";
  return `misfits-export-${date}.${ext}`;
}

/**
 * Trigger a browser download of text content.
 */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
