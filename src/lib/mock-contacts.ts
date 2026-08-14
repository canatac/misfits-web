/**
 * Mock contacts used for recipient autocompletion AND the address book seed.
 * Issue #152 — expanded to 40+ contacts with companies, roles, and tags.
 *
 * `MockContact` (id/name/email/color) stays the minimal shape consumed by the
 * recipient-input autocomplete. `mockContactSeeds` is the richer `Contact`
 * shape used to seed the address-book store. `searchContacts` remains for the
 * recipient input; the store has its own richer search.
 */
import type { Contact, ContactGroup } from "@/types/contact";

export interface MockContact {
  id: string;
  name: string;
  email: string;
  /** Avatar background colour (hex). */
  color: string;
}

export const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

function color(i: number): string {
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}

/** Days-ago helper for seed `lastContactAt` timestamps. */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/* Groups                                                            */
/* ------------------------------------------------------------------ */

export const mockContactGroups: ContactGroup[] = [
  {
    id: "grp-team",
    name: "Engineering Team",
    color: "#6366f1",
    description: "misfits.ai engineers",
    createdAt: new Date().toISOString(),
  },
  {
    id: "grp-leads",
    name: "Team Leads",
    color: "#8b5cf6",
    description: "People managers",
    createdAt: new Date().toISOString(),
  },
  {
    id: "grp-investors",
    name: "Investors",
    color: "#22c55e",
    description: "VCs and angels",
    createdAt: new Date().toISOString(),
  },
  {
    id: "grp-partners",
    name: "Partners",
    color: "#f97316",
    description: "Integration partners",
    createdAt: new Date().toISOString(),
  },
  {
    id: "grp-personal",
    name: "Personal",
    color: "#ec4899",
    description: "Friends and family",
    createdAt: new Date().toISOString(),
  },
];

/* ------------------------------------------------------------------ */
/* Rich seed data (Contact shape)                                    */
/* ------------------------------------------------------------------ */

type Seed = Omit<Contact, "createdAt" | "updatedAt">;

import seedsRawJson from "./mock-contacts-seeds.json";

const seeds: Seed[] = ((): Seed[] => {
  const raw = seedsRawJson as unknown;
  const resolve = <T,>(v: T): T => {
    if (typeof v === "string") {
      const c = v.match(/^__COLOR_(\d+)__$/);
      if (c) return color(Number(c[1])) as unknown as T;
      const d = v.match(/^__DAYSAGO_(\d+)__$/);
      if (d) return daysAgo(Number(d[1])) as unknown as T;
      return v;
    }
    if (Array.isArray(v)) return v.map(resolve) as unknown as T;
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = resolve(val);
      return out as unknown as T;
    }
    return v;
  };
  return resolve(raw) as Seed[];
})();

/** Full Contact-shaped seeds for the address book store (createdAt/updatedAt added by the store). */
export const mockContactSeeds: Seed[] = seeds.map((s) => ({ ...s }));

/** Backwards-compatible minimal list consumed by the recipient input. */
export const mockContacts: MockContact[] = mockContactSeeds.map((c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  color: c.avatarColor,
}));

/**
 * Search contacts by name or email, case-insensitive, capped results.
 * Used by the recipient-input autocomplete.
 */
export function searchContacts(query: string, limit = 8): MockContact[] {
  const q = query.trim().toLowerCase();
  if (!q) return mockContacts.slice(0, limit);
  return mockContacts
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
