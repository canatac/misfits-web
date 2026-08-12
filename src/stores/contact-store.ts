/**
 * Zustand store for the intelligent address book (Issue #152).
 *
 * Owns the contact list, groups, import state, and all mutations
 * (add/update/delete/merge), plus search, import, and vCard/CSV export.
 * Persisted to localStorage so the address book survives reloads.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Contact,
  ContactGroup,
  ContactGroupInput,
  ContactFrequency,
  ContactImport,
  ContactInput,
  DuplicatePair,
} from "@/types/contact";
import {
  mockContactSeeds,
  mockContactGroups,
  AVATAR_COLORS,
} from "@/lib/mock-contacts";
import type { Email } from "@/types/email";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Generate a unique contact id. */
function genId(prefix = "ct"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Pick a deterministic avatar colour from a string seed. */
export function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Derive initials from a name (or email fallback). */
export function contactInitials(name: string, email: string): string {
  const base = name || email.split("@")[0] || "?";
  const parts = base.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Normalise an email address for comparison. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Derive a `ContactFrequency` from an array of ISO timestamps (email dates).
 * daily   → last contact within 1 day
 * weekly  → last contact within 7 days
 * monthly → last contact within 30 days
 * rarely  → older than 30 days but present
 * never   → no history
 */
export function deriveFrequency(dates: string[]): ContactFrequency {
  if (dates.length === 0) return "never";
  const last = Math.max(...dates.map((d) => new Date(d).getTime()));
  if (Number.isNaN(last)) return "never";
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  if (days <= 1) return "daily";
  if (days <= 7) return "weekly";
  if (days <= 30) return "monthly";
  return "rarely";
}

/** Resolve a frequency to a friendly label. */
export const FREQUENCY_LABELS: Record<ContactFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  rarely: "Rarely",
  never: "Never",
};

/* ------------------------------------------------------------------ */
/* Store shape                                                        */
/* ------------------------------------------------------------------ */

interface ContactState {
  contacts: Contact[];
  groups: ContactGroup[];
  isImporting: boolean;

  // Queries
  getContactById: (id: string) => Contact | undefined;
  getContactByEmail: (email: string) => Contact | undefined;
  searchContacts: (query: string) => Contact[];
  findDuplicates: () => DuplicatePair[];

  // Mutations
  addContact: (input: ContactInput) => Contact;
  updateContact: (id: string, input: Partial<ContactInput>) => void;
  deleteContact: (id: string) => void;
  mergeContacts: (primaryId: string, duplicateId: string) => void;

  // Groups
  addGroup: (input: ContactGroupInput) => ContactGroup;
  updateGroup: (id: string, input: Partial<ContactGroupInput>) => void;
  deleteGroup: (id: string) => void;

  // Import / export
  importContacts: (imports: ContactImport[]) => number;
  exportContactsVCard: () => string;
  exportContactsCSV: () => string;

  /** Re-enrich lastContactAt / frequency from the email corpus. */
  enrichFromEmails: (emails: Email[]) => void;
}

/* ------------------------------------------------------------------ */
/* Export serialisers                                                 */
/* ------------------------------------------------------------------ */

function toVCard(c: Contact): string {
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

function toCSVRow(fields: string[]): string {
  return fields
    .map((f) => {
      const v = f ?? "";
      if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    })
    .join(",");
}

function exportCSV(contacts: Contact[]): string {
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

/* ------------------------------------------------------------------ */
/* CSV / vCard parsers (for import preview)                          */
/* ------------------------------------------------------------------ */

/** Parse a vCard text blob into import records. */
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

/** Parse a CSV text blob (with a header row) into import records. */
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

/** Minimal RFC-4180-ish CSV row splitter (handles quoted fields + commas). */
function parseCSVRows(text: string): string[][] {
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

/* ------------------------------------------------------------------ */
/* Store implementation                                               */
/* ------------------------------------------------------------------ */

const nowISO = () => new Date().toISOString();

/** Seed contacts derived from the richer mock dataset on first load. */
function seedContacts(): Contact[] {
  const created = nowISO();
  return mockContactSeeds.map((c) => ({
    ...c,
    notes: c.notes,
    groupId: c.groupId,
    createdAt: created,
    updatedAt: created,
  }));
}

function seedGroups(): ContactGroup[] {
  const created = nowISO();
  return mockContactGroups.map((g) => ({ ...g, createdAt: created }));
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: seedContacts(),
      groups: seedGroups(),
      isImporting: false,

      getContactById: (id) => get().contacts.find((c) => c.id === id),
      getContactByEmail: (email) => {
        const e = normalizeEmail(email);
        return get().contacts.find((c) => normalizeEmail(c.email) === e);
      },

      searchContacts: (query) => {
        const q = query.trim().toLowerCase();
        const all = get().contacts;
        if (!q) return all;
        return all.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company ?? "").toLowerCase().includes(q) ||
            (c.role ?? "").toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q))
        );
      },

      findDuplicates: () => {
        const contacts = get().contacts;
        const byEmail = new Map<string, Contact>();
        const byName = new Map<string, Contact>();
        const pairs: DuplicatePair[] = [];
        for (const c of contacts) {
          const e = normalizeEmail(c.email);
          if (byEmail.has(e)) {
            const prev = byEmail.get(e)!;
            pairs.push({
              primaryId: prev.id,
              duplicateId: c.id,
              reason: "email",
            });
          } else {
            byEmail.set(e, c);
          }
          const n = c.name.trim().toLowerCase();
          if (n && byName.has(n)) {
            const prev = byName.get(n)!;
            // Only suggest a name-based duplicate if it isn't already an email one.
            if (
              prev.id !== c.id &&
              !pairs.some((p) => p.duplicateId === c.id)
            ) {
              pairs.push({
                primaryId: prev.id,
                duplicateId: c.id,
                reason: "name",
              });
            }
          } else if (n) {
            byName.set(n, c);
          }
        }
        return pairs;
      },

      addContact: (input) => {
        const ts = nowISO();
        const contact: Contact = {
          id: genId(),
          name: input.name.trim(),
          email: normalizeEmail(input.email),
          phone: input.phone?.trim() || undefined,
          company: input.company?.trim() || undefined,
          role: input.role?.trim() || undefined,
          avatarColor:
            input.avatarColor || pickAvatarColor(input.email || input.name),
          lastContactAt: input.lastContactAt ?? null,
          contactFrequency: input.contactFrequency ?? "never",
          tags: (input.tags ?? [])
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          notes: input.notes?.trim() || undefined,
          groupId: input.groupId,
          createdAt: ts,
          updatedAt: ts,
        };
        set((s) => ({ contacts: [...s.contacts, contact] }));
        return contact;
      },

      updateContact: (id, input) => {
        set((s) => ({
          contacts: s.contacts.map((c) => {
            if (c.id !== id) return c;
            return {
              ...c,
              ...("name" in input ? { name: input.name!.trim() } : {}),
              ...("email" in input
                ? { email: normalizeEmail(input.email!) }
                : {}),
              ...("phone" in input
                ? { phone: input.phone?.trim() || undefined }
                : {}),
              ...("company" in input
                ? { company: input.company?.trim() || undefined }
                : {}),
              ...("role" in input
                ? { role: input.role?.trim() || undefined }
                : {}),
              ...("avatarColor" in input
                ? { avatarColor: input.avatarColor! }
                : {}),
              ...("notes" in input
                ? { notes: input.notes?.trim() || undefined }
                : {}),
              ...("groupId" in input ? { groupId: input.groupId } : {}),
              ...("lastContactAt" in input
                ? { lastContactAt: input.lastContactAt ?? null }
                : {}),
              ...("contactFrequency" in input
                ? { contactFrequency: input.contactFrequency! }
                : {}),
              ...("tags" in input
                ? {
                    tags: (input.tags ?? [])
                      .map((t) => t.trim().toLowerCase())
                      .filter(Boolean),
                  }
                : {}),
              updatedAt: nowISO(),
            };
          }),
        }));
      },

      deleteContact: (id) => {
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
      },

      mergeContacts: (primaryId, duplicateId) => {
        const { contacts } = get();
        const primary = contacts.find((c) => c.id === primaryId);
        const duplicate = contacts.find((c) => c.id === duplicateId);
        if (!primary || !duplicate) return;
        const merged: Contact = {
          ...primary,
          // Fill any missing primary fields from the duplicate.
          phone: primary.phone ?? duplicate.phone,
          company: primary.company ?? duplicate.company,
          role: primary.role ?? duplicate.role,
          notes: primary.notes ?? duplicate.notes,
          groupId: primary.groupId ?? duplicate.groupId,
          // Union tags + keep the more-recent lastContactAt.
          tags: Array.from(new Set([...primary.tags, ...duplicate.tags])),
          lastContactAt:
            primary.lastContactAt && duplicate.lastContactAt
              ? primary.lastContactAt > duplicate.lastContactAt
                ? primary.lastContactAt
                : duplicate.lastContactAt
              : (primary.lastContactAt ?? duplicate.lastContactAt),
          contactFrequency:
            (
              ["daily", "weekly", "monthly", "rarely", "never"] as const
            ).indexOf(primary.contactFrequency) <=
            (
              ["daily", "weekly", "monthly", "rarely", "never"] as const
            ).indexOf(duplicate.contactFrequency)
              ? primary.contactFrequency
              : duplicate.contactFrequency,
          updatedAt: nowISO(),
        };
        set((s) => ({
          contacts: s.contacts
            .map((c) => (c.id === primaryId ? merged : c))
            .filter((c) => c.id !== duplicateId),
        }));
      },

      addGroup: (input) => {
        const group: ContactGroup = {
          id: genId("grp"),
          name: input.name.trim(),
          color: input.color || pickAvatarColor(input.name),
          description: input.description,
          createdAt: nowISO(),
        };
        set((s) => ({ groups: [...s.groups, group] }));
        return group;
      },

      updateGroup: (id, input) => {
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === id
              ? {
                  ...g,
                  name: input.name?.trim() ?? g.name,
                  color: input.color ?? g.color,
                  description: input.description ?? g.description,
                }
              : g
          ),
        }));
      },

      deleteGroup: (id) => {
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          // Unassign contacts that belonged to the deleted group.
          contacts: s.contacts.map((c) =>
            c.groupId === id ? { ...c, groupId: undefined } : c
          ),
        }));
      },

      importContacts: (imports) => {
        set({ isImporting: true });
        let added = 0;
        const next = [...get().contacts];
        for (const imp of imports) {
          const email = imp.email?.trim();
          const name = imp.name?.trim();
          if (!email && !name) continue;
          const normalized = email ? normalizeEmail(email) : "";
          // Skip duplicates by email.
          if (
            normalized &&
            next.some((c) => normalizeEmail(c.email) === normalized)
          )
            continue;
          const ts = nowISO();
          next.push({
            id: genId(),
            name: name || normalized.split("@")[0] || "Unknown",
            email: normalized || `unknown-${Date.now().toString(36)}@unknown`,
            phone: imp.phone?.trim() || undefined,
            company: imp.company?.trim() || undefined,
            role: imp.role?.trim() || undefined,
            avatarColor: pickAvatarColor(name || normalized),
            lastContactAt: null,
            contactFrequency: "never",
            tags: (imp.tags ?? [])
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean),
            notes: imp.notes?.trim() || undefined,
            createdAt: ts,
            updatedAt: ts,
          });
          added++;
        }
        set({ contacts: next, isImporting: false });
        return added;
      },

      exportContactsVCard: () => {
        return get().contacts.map(toVCard).join("\r\n");
      },

      exportContactsCSV: () => {
        return exportCSV(get().contacts);
      },

      enrichFromEmails: (emails) => {
        const { contacts } = get();
        if (contacts.length === 0 || emails.length === 0) return;
        // Group email timestamps by contact email (from + to).
        const byContact = new Map<string, string[]>();
        const index = (addr: string) => {
          const e = normalizeEmail(addr);
          if (!e) return;
          const arr = byContact.get(e) ?? [];
          arr.push("date");
          byContact.set(e, arr);
        };
        for (const em of emails) {
          const ts = em.date;
          index(em.from.address);
          for (const r of em.to) {
            const arr = byContact.get(normalizeEmail(r.address)) ?? [];
            arr.push(ts);
            byContact.set(normalizeEmail(r.address), arr);
          }
          for (const r of em.cc ?? []) {
            const arr = byContact.get(normalizeEmail(r.address)) ?? [];
            arr.push(ts);
            byContact.set(normalizeEmail(r.address), arr);
          }
        }
        set((s) => ({
          contacts: s.contacts.map((c) => {
            const dates = byContact.get(normalizeEmail(c.email));
            if (!dates || dates.length === 0) return c;
            const freq = deriveFrequency(dates);
            const last = dates.sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime()
            )[0];
            return {
              ...c,
              lastContactAt: last,
              contactFrequency: freq,
              updatedAt: nowISO(),
            };
          }),
        }));
      },
    }),
    {
      name: "misfits-contacts-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ contacts: s.contacts, groups: s.groups }),
    }
  )
);
