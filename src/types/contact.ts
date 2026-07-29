/**
 * Contact domain types for the intelligent address book (Issue #152).
 *
 * A `Contact` represents a person the user has corresponded with. The store
 * auto-enriches contacts from the email corpus (last contact date, frequency,
 * tags) and supports manual grouping, notes, and deduplication via merge.
 */

/** How often the user tends to contact this person, derived from history. */
export type ContactFrequency = "daily" | "weekly" | "monthly" | "rarely" | "never";

/** A single contact record. */
export interface Contact {
  /** Stable unique id. */
  id: string;
  /** Full display name. */
  name: string;
  /** Primary email address (lowercased). */
  email: string;
  /** Optional phone number. */
  phone?: string;
  /** Optional company / organisation. */
  company?: string;
  /** Optional job title / role. */
  role?: string;
  /** Avatar background colour (hex) used for the coloured-initials avatar. */
  avatarColor: string;
  /** ISO timestamp of the most recent email exchanged with this contact. */
  lastContactAt: string | null;
  /** Heuristic contact cadence, computed from the email corpus. */
  contactFrequency: ContactFrequency;
  /** Free-form tags (lowercase strings). */
  tags: string[];
  /** Optional free-form notes authored by the user. */
  notes?: string;
  /** Optional group id (see `ContactGroup`). */
  groupId?: string;
  /** ISO timestamp of record creation. */
  createdAt: string;
  /** ISO timestamp of the last edit. */
  updatedAt: string;
}

/** A user-defined grouping of contacts (e.g. "Investors", "Team"). */
export interface ContactGroup {
  id: string;
  name: string;
  /** Hex colour for the group chip. */
  color: string;
  /** Optional human description. */
  description?: string;
  /** ISO timestamp of creation. */
  createdAt: string;
}

/** Shape accepted by the import pipeline (loose — all fields optional bar name/email). */
export interface ContactImport {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  tags?: string[];
  notes?: string;
}

/** Input for creating/updating a contact programmatically. */
export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  avatarColor?: string;
  tags?: string[];
  notes?: string;
  groupId?: string;
  lastContactAt?: string | null;
  contactFrequency?: ContactFrequency;
}

/** Input for creating a group. */
export interface ContactGroupInput {
  name: string;
  color?: string;
  description?: string;
}

/** Result of a search/dedup pass — contacts that share an email or name. */
export interface DuplicatePair {
  /** The contact to keep after merging. */
  primaryId: string;
  /** The contact to merge into primary and then delete. */
  duplicateId: string;
  /** What triggered the duplicate suggestion. */
  reason: "email" | "name";
}
