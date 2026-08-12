/**
 * Search query parser — converts a raw query string into a structured SearchQuery.
 *
 * Tokenizes operator:value pairs (e.g. `from:"John Doe"`) and treats the
 * remaining tokens as full-text search terms. Quoted values are supported.
 */
import type { SearchFilters, SearchQuery } from "@/types/search";

/** Parse a size string like "5M", "200K", "1.5G" into bytes. Returns 0 if unparseable. */
export function parseSize(value: string): number {
  const match = value.trim().match(/^([\d.]+)\s*([kKmMgGtT]?)(b?ytes?)?$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    "": 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
    t: 1024 * 1024 * 1024 * 1024,
  };
  return num * (multipliers[unit] ?? 1);
}

/** Flexible date parser — accepts YYYY, YYYY/MM, YYYY-MM, YYYY/MM/DD, YYYY-MM-DD, relative "7d"/"30d". */
export function parseDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Relative days: "7d", "30d", "1y"
  const relMatch = trimmed.match(/^(\d+)\s*([dy])$/);
  if (relMatch) {
    const n = parseInt(relMatch[1], 10);
    const d = new Date();
    if (relMatch[2] === "d") d.setDate(d.getDate() - n);
    else if (relMatch[2] === "y") d.setFullYear(d.getFullYear() - n);
    return d.toISOString();
  }

  // YYYY or YYYY/MM or YYYY/MM/DD (with / or - separators)
  const dateMatch = trimmed.match(
    /^(\d{4})([/\-](\d{1,2}))?([/\-](\d{1,2}))?$/
  );
  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = dateMatch[3] ? parseInt(dateMatch[3], 10) : 1;
    const day = dateMatch[5] ? parseInt(dateMatch[5], 10) : 1;
    const d = new Date(year, month - 1, day);
    return d.toISOString();
  }

  // Fallback: try Date.parse
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) return new Date(parsed).toISOString();

  return undefined;
}

interface Token {
  text: string;
  isOperator: boolean;
  operator?: string;
  value?: string;
}

/**
 * Tokenize the raw query into operator tokens and free-text tokens.
 * Handles quoted values: `from:"John Doe"` and `subject:'Q3 Roadmap'`.
 */
function tokenize(raw: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\w+:)(?:"([^"]*)"|'([^']*)'|(\S+))|\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match[1]) {
      // Operator token
      const operator = match[1].slice(0, -1).toLowerCase();
      const value = match[2] ?? match[3] ?? match[4] ?? "";
      tokens.push({ text: match[0], isOperator: true, operator, value });
    } else {
      tokens.push({ text: match[0], isOperator: false });
    }
  }

  return tokens;
}

/** Apply a single operator token to the filters object. */
function applyOperator(
  filters: SearchFilters,
  operator: string,
  value: string
): void {
  switch (operator) {
    case "from":
      filters.from = value;
      break;
    case "to":
      filters.to = value;
      break;
    case "subject":
      filters.subject = value;
      break;
    case "has":
      if (
        value.toLowerCase() === "attachment" ||
        value.toLowerCase() === "attachments"
      ) {
        filters.hasAttachment = true;
      }
      break;
    case "before": {
      const date = parseDate(value);
      if (date) filters.before = date;
      break;
    }
    case "after": {
      const date = parseDate(value);
      if (date) filters.after = date;
      break;
    }
    case "is":
      if (value === "unread") filters.isUnread = true;
      else if (value === "read") filters.isRead = true;
      else if (value === "starred") filters.isStarred = true;
      break;
    case "label":
      filters.label = value;
      break;
    case "filename":
      filters.filename = value;
      break;
    case "larger":
      filters.larger = parseSize(value);
      break;
    case "smaller":
      filters.smaller = parseSize(value);
      break;
    default:
      break;
  }
}

/**
 * Parse a raw query string into a structured SearchQuery.
 */
export function parseSearchQuery(raw: string): SearchQuery {
  const filters: SearchFilters = {};
  const textTerms: string[] = [];

  const tokens = tokenize(raw);

  for (const token of tokens) {
    if (token.isOperator && token.operator && token.value !== undefined) {
      applyOperator(filters, token.operator, token.value);
    } else {
      textTerms.push(token.text);
    }
  }

  return { raw, textTerms, filters };
}

/**
 * Extract the operator prefix being typed (for autocomplete).
 * e.g. "from:Sa" → { operator: "from", partial: "Sa" }
 * e.g. "hello" → null (no active operator)
 */
export function getActiveOperator(
  raw: string,
  cursorPos: number
): { operator: string; partial: string } | null {
  const before = raw.slice(0, cursorPos);
  const match = before.match(/(\w+):(?:"([^"]*)"?|'([^']*)'?|(\S*))$/);
  if (!match) return null;
  const operator = match[1].toLowerCase();
  const partial = match[2] ?? match[3] ?? match[4] ?? "";
  return { operator, partial };
}
