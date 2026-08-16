/**
 * Zustand store for the intelligent address book (Issue #152).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Contact,
  ContactGroup,
  ContactGroupInput,
  ContactImport,
  ContactInput,
  DuplicatePair,
} from "@/types/contact";
import {
  mockContactSeeds,
  mockContactGroups,
} from "@/lib/mock-contacts";
import type { Email } from "@/types/email";
import {
  genId,
  pickAvatarColor,
  normalizeEmail,
  nowISO,
} from "./contact-utils";
import { toVCard, exportCSV } from "./contact-serialisers";
import {
  applyContactPatch,
  buildImports,
  enrichContactsWithEmails,
  findDuplicates,
  mergeContact,
} from "./contact-store/helpers";

interface ContactState {
  contacts: Contact[];
  groups: ContactGroup[];
  isImporting: boolean;

  getContactById: (id: string) => Contact | undefined;
  getContactByEmail: (email: string) => Contact | undefined;
  searchContacts: (query: string) => Contact[];
  findDuplicates: () => DuplicatePair[];

  addContact: (input: ContactInput) => Contact;
  updateContact: (id: string, input: Partial<ContactInput>) => void;
  deleteContact: (id: string) => void;
  mergeContacts: (primaryId: string, duplicateId: string) => void;

  addGroup: (input: ContactGroupInput) => ContactGroup;
  updateGroup: (id: string, input: Partial<ContactGroupInput>) => void;
  deleteGroup: (id: string) => void;

  importContacts: (imports: ContactImport[]) => number;
  exportContactsVCard: () => string;
  exportContactsCSV: () => string;

  enrichFromEmails: (emails: Email[]) => void;
}

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

      findDuplicates: () => findDuplicates(get().contacts),

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
          contacts: s.contacts.map((c) =>
            c.id === id ? applyContactPatch(c, input) : c
          ),
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
        const merged = mergeContact(primary, duplicate);
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
          contacts: s.contacts.map((c) =>
            c.groupId === id ? { ...c, groupId: undefined } : c
          ),
        }));
      },

      importContacts: (imports) => {
        set({ isImporting: true });
        const { next, added } = buildImports(get().contacts, imports);
        set({ contacts: next, isImporting: false });
        return added;
      },

      exportContactsVCard: () =>
        get().contacts.map(toVCard).join("\r\n"),

      exportContactsCSV: () => exportCSV(get().contacts),

      enrichFromEmails: (emails) => {
        set((s) => ({ contacts: enrichContactsWithEmails(s.contacts, emails) }));
      },
    }),
    {
      name: "misfits-contacts-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ contacts: s.contacts, groups: s.groups }),
    }
  )
);

export {
  contactInitials,
  pickAvatarColor,
  deriveFrequency,
  FREQUENCY_LABELS,
} from "./contact-utils";
export { parseVCard, parseCSV } from "./contact-serialisers";
