import type {
  Contact,
  ContactImport,
  ContactInput,
  DuplicatePair,
} from "@/types/contact";
import type { Email } from "@/types/email";
import {
  genId,
  pickAvatarColor,
  normalizeEmail,
  deriveFrequency,
  nowISO,
} from "../contact-utils";

export function findDuplicates(contacts: Contact[]): DuplicatePair[] {
  const byEmail = new Map<string, Contact>();
  const byName = new Map<string, Contact>();
  const pairs: DuplicatePair[] = [];
  for (const c of contacts) {
    const e = normalizeEmail(c.email);
    if (byEmail.has(e)) {
      const prev = byEmail.get(e)!;
      pairs.push({ primaryId: prev.id, duplicateId: c.id, reason: "email" });
    } else {
      byEmail.set(e, c);
    }
    const n = c.name.trim().toLowerCase();
    if (n && byName.has(n)) {
      const prev = byName.get(n)!;
      if (prev.id !== c.id && !pairs.some((p) => p.duplicateId === c.id)) {
        pairs.push({ primaryId: prev.id, duplicateId: c.id, reason: "name" });
      }
    } else if (n) {
      byName.set(n, c);
    }
  }
  return pairs;
}

export function applyContactPatch(c: Contact, input: Partial<ContactInput>): Contact {
  return {
    ...c,
    ...("name" in input ? { name: input.name!.trim() } : {}),
    ...("email" in input ? { email: normalizeEmail(input.email!) } : {}),
    ...("phone" in input ? { phone: input.phone?.trim() || undefined } : {}),
    ...("company" in input ? { company: input.company?.trim() || undefined } : {}),
    ...("role" in input ? { role: input.role?.trim() || undefined } : {}),
    ...("avatarColor" in input ? { avatarColor: input.avatarColor! } : {}),
    ...("notes" in input ? { notes: input.notes?.trim() || undefined } : {}),
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
}

const FREQ_ORDER = ["daily", "weekly", "monthly", "rarely", "never"] as const;

export function mergeContact(primary: Contact, duplicate: Contact): Contact {
  return {
    ...primary,
    phone: primary.phone ?? duplicate.phone,
    company: primary.company ?? duplicate.company,
    role: primary.role ?? duplicate.role,
    notes: primary.notes ?? duplicate.notes,
    groupId: primary.groupId ?? duplicate.groupId,
    tags: Array.from(new Set([...primary.tags, ...duplicate.tags])),
    lastContactAt:
      primary.lastContactAt && duplicate.lastContactAt
        ? primary.lastContactAt > duplicate.lastContactAt
          ? primary.lastContactAt
          : duplicate.lastContactAt
        : (primary.lastContactAt ?? duplicate.lastContactAt),
    contactFrequency:
      FREQ_ORDER.indexOf(primary.contactFrequency) <=
      FREQ_ORDER.indexOf(duplicate.contactFrequency)
        ? primary.contactFrequency
        : duplicate.contactFrequency,
    updatedAt: nowISO(),
  };
}

export function buildImports(
  existing: Contact[],
  imports: ContactImport[]
): { next: Contact[]; added: number } {
  const next = [...existing];
  let added = 0;
  for (const imp of imports) {
    const email = imp.email?.trim();
    const name = imp.name?.trim();
    if (!email && !name) continue;
    const normalized = email ? normalizeEmail(email) : "";
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
  return { next, added };
}

export function enrichContactsWithEmails(
  contacts: Contact[],
  emails: Email[]
): Contact[] {
  if (contacts.length === 0 || emails.length === 0) return contacts;
  const byContact = new Map<string, string[]>();
  for (const em of emails) {
    const ts = em.date;
    const fromKey = normalizeEmail(em.from.address);
    if (fromKey) {
      const arr = byContact.get(fromKey) ?? [];
      arr.push(ts);
      byContact.set(fromKey, arr);
    }
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
  return contacts.map((c) => {
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
  });
}
