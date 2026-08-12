/**
 * Search domain types for misfits.ai Mail.
 * Supports Gmail-style operator syntax (from:, to:, subject:, has:attachment, etc.)
 * with structured filters, saved searches, and search history.
 */
import type { Email, Folder } from "./email";

/** Supported search operators. */
export type SearchOperator =
  | "from"
  | "to"
  | "subject"
  | "has"
  | "before"
  | "after"
  | "is"
  | "label"
  | "filename"
  | "larger"
  | "smaller";

/** Metadata for each operator, used by the search bar for autocomplete hints. */
export interface OperatorMeta {
  operator: SearchOperator;
  label: string;
  description: string;
  example: string;
  /** Accepts a free-form value (vs. a boolean flag). */
  hasValue: boolean;
  /** Suggested values for autocomplete. */
  suggestions?: string[];
}

export const OPERATOR_META: OperatorMeta[] = [
  {
    operator: "from",
    label: "from:",
    description: "Sender name or email",
    example: 'from:"John Doe"',
    hasValue: true,
  },
  {
    operator: "to",
    label: "to:",
    description: "Recipient name or email",
    example: "to:alice@example.com",
    hasValue: true,
  },
  {
    operator: "subject",
    label: "subject:",
    description: "Words in the subject line",
    example: "subject:roadmap",
    hasValue: true,
  },
  {
    operator: "has",
    label: "has:",
    description: "Has attachment",
    example: "has:attachment",
    hasValue: true,
    suggestions: ["attachment"],
  },
  {
    operator: "before",
    label: "before:",
    description: "Received before a date",
    example: "before:2024/01/01",
    hasValue: true,
  },
  {
    operator: "after",
    label: "after:",
    description: "Received after a date",
    example: "after:2024/06/01",
    hasValue: true,
  },
  {
    operator: "is",
    label: "is:",
    description: "Email state",
    example: "is:unread",
    hasValue: true,
    suggestions: ["unread", "starred", "read"],
  },
  {
    operator: "label",
    label: "label:",
    description: "Has a label",
    example: "label:work",
    hasValue: true,
  },
  {
    operator: "filename",
    label: "filename:",
    description: "Attachment filename",
    example: "filename:report.pdf",
    hasValue: true,
  },
  {
    operator: "larger",
    label: "larger:",
    description: "Larger than a size (e.g. 5M, 200K)",
    example: "larger:5M",
    hasValue: true,
  },
  {
    operator: "smaller",
    label: "smaller:",
    description: "Smaller than a size",
    example: "smaller:1M",
    hasValue: true,
  },
];

export const OPERATOR_MAP: Record<string, OperatorMeta> = Object.fromEntries(
  OPERATOR_META.map((m) => [m.operator, m])
);

/** Structured filter values extracted from operator syntax. */
export interface SearchFilters {
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  before?: string; // ISO date
  after?: string; // ISO date
  isUnread?: boolean;
  isStarred?: boolean;
  isRead?: boolean;
  label?: string;
  filename?: string;
  larger?: number; // bytes
  smaller?: number; // bytes
}

/** A single parsed search query — operators + free-text terms. */
export interface SearchQuery {
  raw: string;
  textTerms: string[];
  filters: SearchFilters;
}

/** Where a match was found, with character offsets for highlighting. */
export interface MatchHighlight {
  field: "subject" | "from" | "to" | "body" | "preview" | "filename";
  start: number;
  end: number;
  term: string;
}

/** A single search result — an email plus relevance info. */
export interface SearchResult {
  email: Email;
  score: number;
  highlights: MatchHighlight[];
}

/** A user-saved named search. */
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

/** An entry in the search history (recent queries). */
export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
}

/** Sort mode for search results. */
export type SearchSort = "relevance" | "date";

/** Faceted filter aggregation — counts per facet value. */
export interface SearchFacets {
  folders: Record<string, number>;
  labels: Record<string, number>;
  hasAttachment: number;
  isUnread: number;
  isStarred: number;
  dateRanges: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
}
