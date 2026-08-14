"use client";
// contact-serialisers.ts — extracted Sprint 3-3
import type { Contact, ContactImport } from "@/types/contact";

export function toVCard(c: Contact): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${c.name}`,
    `EMAIL;TYPE=INTERNET:${c.email}`,
  ];
  if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
  if (c.company) lines.push(`ORG:${c.company}`);
  if (c.role) lines.push(`TITLE:${c.role}`);
  if (c.notes) lines.push(`NOTE:${c.notes.replace(/\n/g, "\\n")}`);
  if (c.tags.length > 0) lines.push(`CATEGORIES:${c.tags.join(",")}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function toCSVRow(fields: string[]): string {
  return fields
    .map((f) => {
      const v = f ?? "";
      if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    })
    .join(",");
}

export function exportCSV(contacts: Contact[]): string {
  const header = [
    "name",
    "email",
    "phone",
    "company",
    "role",
    "tags",
    "notes",
    "frequency",
    "lastContactAt",
  ];
  const rows = contacts.map((c) =>
    toCSVRow([
      c.name,
      c.email,
      c.phone ?? "",
      c.company ?? "",
      c.role ?? "",
      c.tags.join(";"),
      c.notes ?? "",
      c.contactFrequency,
      c.lastContactAt ?? "",
    ])
  );
  return [header.join(","), ...rows].join("\n");
}

export function parseVCard(text: string): ContactImport[] {
  const out: ContactImport[] = [];
  const blocks = text.split(/BEGIN:VCARD/i).slice(1);
  for (const block of blocks) {
    const end = block.search(/END:VCARD/i);
    const body = end >= 0 ? block.slice(0, end) : block;
    const lines = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const imp: ContactImport = {};
    for (const line of lines) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const key = line.slice(0, colon).toUpperCase();
      const val = line.slice(colon + 1);
      if (key.startsWith("FN") || key.startsWith("N")) {
        if (!imp.name) imp.name = val.replace(/;/g, " ").trim();
      } else if (key.startsWith("EMAIL")) {
        imp.email = val.trim();
      } else if (key.startsWith("TEL")) {
        imp.phone = val.trim();
      } else if (key.startsWith("ORG")) {
        imp.company = val.replace(/;/g, " ").trim();
      } else if (key.startsWith("TITLE")) {
        imp.role = val.trim();
      } else if (key.startsWith("NOTE")) {
        imp.notes = val.replace(/\\n/g, "\n");
      } else if (key.startsWith("CATEGORIES")) {
        imp.tags = val
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }
    if (imp.name || imp.email) out.push(imp);
  }
  return out;
}

export function parseCSV(text: string): ContactImport[] {
  const rows = parseCSVRows(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const out: ContactImport[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 0) continue;
    const imp: ContactImport = {};
    for (let c = 0; c < cells.length && c < header.length; c++) {
      const val = cells[c].trim();
      if (!val) continue;
      const key = header[c];
      if (key === "name") imp.name = val;
      else if (key === "email") imp.email = val;
      else if (key === "phone" || key === "tel") imp.phone = val;
      else if (key === "company" || key === "org") imp.company = val;
      else if (key === "role" || key === "title") imp.role = val;
      else if (key === "notes" || key === "note") imp.notes = val;
      else if (key === "tags" || key === "categories")
        imp.tags = val
          .split(/[;,]/)
          .map((t) => t.trim())
          .filter(Boolean);
    }
    if (imp.name || imp.email) out.push(imp);
  }
  return out;
}

export function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cur.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

