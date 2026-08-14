/**
 * Matcher : évalue les filtres opérateurs (from:, to:, subject:, has:attachment,
 * before/after, is:unread/read/starred, label:, filename:, larger/smaller)
 * contre un email, et collecte les positions de highlight des termes texte.
 */
import type { Email } from "@/types/email";
import type { MatchHighlight, SearchFilters } from "@/types/search";
import { matchTerm, normalize, stripHtml } from "./text-utils";

/** Collect all highlight positions for a set of terms across an email's fields. */
export function collectHighlights(
  email: Email,
  terms: string[]
): MatchHighlight[] {
  const highlights: MatchHighlight[] = [];
  const subject = normalize(email.subject);
  const fromName = normalize(email.from.name);
  const fromAddr = normalize(email.from.address);
  const toStr = normalize(
    email.to.map((t) => `${t.name} ${t.address}`).join(" ")
  );
  const preview = normalize(email.preview);
  const body = normalize(stripHtml(email.body));

  for (const term of terms) {
    const t = normalize(term);
    if (!t) continue;

    let idx = matchTerm(subject, t);
    if (idx >= 0) {
      highlights.push({ field: "subject", start: idx, end: idx + t.length, term: t });
    }

    idx = matchTerm(fromName, t);
    if (idx >= 0) {
      highlights.push({ field: "from", start: idx, end: idx + t.length, term: t });
    } else {
      idx = matchTerm(fromAddr, t);
      if (idx >= 0) {
        highlights.push({ field: "from", start: idx, end: idx + t.length, term: t });
      }
    }

    idx = matchTerm(toStr, t);
    if (idx >= 0) {
      highlights.push({ field: "to", start: idx, end: idx + t.length, term: t });
    }

    idx = matchTerm(preview, t);
    if (idx >= 0) {
      highlights.push({ field: "preview", start: idx, end: idx + t.length, term: t });
    }

    idx = matchTerm(body, t);
    if (idx >= 0) {
      highlights.push({ field: "body", start: idx, end: idx + t.length, term: t });
    }

    for (const att of email.attachments) {
      idx = matchTerm(normalize(att.filename), t);
      if (idx >= 0) {
        highlights.push({ field: "filename", start: idx, end: idx + t.length, term: t });
      }
    }
  }

  return highlights;
}

/** Apply structured filters to a single email. Returns true if the email passes all filters. */
export function applyFilters(email: Email, filters: SearchFilters): boolean {
  if (filters.from) {
    const f = normalize(filters.from);
    if (
      !matchTerm(normalize(email.from.name), f) &&
      !matchTerm(normalize(email.from.address), f)
    ) {
      return false;
    }
  }

  if (filters.to) {
    const t = normalize(filters.to);
    const allRecipients = [
      ...email.to,
      ...(email.cc ?? []),
      ...(email.bcc ?? []),
    ];
    const matches = allRecipients.some(
      (r) =>
        matchTerm(normalize(r.name), t) >= 0 ||
        matchTerm(normalize(r.address), t) >= 0
    );
    if (!matches) return false;
  }

  if (filters.subject) {
    const s = normalize(filters.subject);
    if (matchTerm(normalize(email.subject), s) < 0) return false;
  }

  if (filters.hasAttachment !== undefined) {
    if (email.hasAttachments !== filters.hasAttachment) return false;
  }

  if (filters.before) {
    if (new Date(email.date).getTime() >= new Date(filters.before).getTime()) {
      return false;
    }
  }

  if (filters.after) {
    if (new Date(email.date).getTime() <= new Date(filters.after).getTime()) {
      return false;
    }
  }

  if (filters.isUnread !== undefined) {
    if (email.isRead !== !filters.isUnread) return false;
  }

  if (filters.isRead !== undefined) {
    if (email.isRead !== filters.isRead) return false;
  }

  if (filters.isStarred !== undefined) {
    if (email.isStarred !== filters.isStarred) return false;
  }

  if (filters.label) {
    const l = normalize(filters.label);
    const labelMatch = email.labels.some((lbl) => {
      const id = normalize(lbl.replace(/^label-/, ""));
      return matchTerm(id, l) >= 0;
    });
    if (!labelMatch) return false;
  }

  if (filters.filename) {
    const fn = normalize(filters.filename);
    const hasFile = email.attachments.some(
      (a) => matchTerm(normalize(a.filename), fn) >= 0
    );
    if (!hasFile) return false;
  }

  if (filters.larger !== undefined && filters.larger > 0) {
    if (email.size < filters.larger) return false;
  }

  if (filters.smaller !== undefined && filters.smaller > 0) {
    if (email.size > filters.smaller) return false;
  }

  return true;
}
