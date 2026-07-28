/**
 * Email validation utilities for the composer.
 *
 * `validateEmail` checks the format, `validateDomain` is a lightweight MX /
 * domain check (stubbed — no DNS in the browser), `checkExternalRecipient`
 * flags recipients outside the misfits.ai domain, and `checkAttachmentMention`
 * scans the body for attachment keywords to warn when an attachment is
 * referenced but none is attached.
 */

/** RFC 5322 simplified email regex (sufficient for client-side validation). */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** The internal domain — recipients on other domains are "external". */
export const INTERNAL_DOMAIN = "misfits.ai";

/**
 * Validate an email address format.
 * Returns true when the address matches the expected shape.
 */
export function validateEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254) return false;
  return EMAIL_RE.test(trimmed);
}

/**
 * Extract the domain from an email address.
 */
export function getDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/**
 * Lightweight domain check (MX record stub).
 *
 * A real MX lookup requires a DNS resolver which is unavailable in the
 * browser. We instead reject obviously invalid domains (no dot, reserved
 * TLDs, empty) and accept otherwise. This mirrors a "best-effort" check that
 * could be swapped for a server-side resolver later.
 */
export function validateDomain(email: string): boolean {
  const domain = getDomain(email);
  if (!domain) return false;
  // Must contain at least one dot and a TLD of 2+ chars.
  const parts = domain.split(".");
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1];
  if (tld.length < 2) return false;
  // Reject localhost-style or single-label hosts.
  if (domain === "localhost" || domain.endsWith(".localhost")) return false;
  return true;
}

/**
 * Returns true when the recipient is on a domain other than misfits.ai.
 */
export function checkExternalRecipient(email: string): boolean {
  const domain = getDomain(email);
  if (!domain) return false;
  return domain !== INTERNAL_DOMAIN && !domain.endsWith(`.${INTERNAL_DOMAIN}`);
}

/**
 * Full validation for a single recipient address.
 */
export function validateRecipient(email: string): {
  valid: boolean;
  domainOk: boolean;
  external: boolean;
  reason?: string;
} {
  const valid = validateEmail(email);
  const domainOk = valid && validateDomain(email);
  const external = valid && checkExternalRecipient(email);
  let reason: string | undefined;
  if (!valid) reason = "Invalid email format";
  else if (!domainOk) reason = "Domain does not appear to accept mail";
  return { valid, domainOk, external, reason };
}

/** Keywords that suggest the body references an attachment. */
const ATTACHMENT_KEYWORDS = [
  "attach",
  "attached",
  "attachment",
  "enclosed",
  "included",
  "see the file",
  "see the document",
  "see the image",
  "see the pdf",
  "i've attached",
  "i have attached",
];

/**
 * Scan plain-text body content for attachment keywords.
 * Returns true when any keyword is found.
 */
export function checkAttachmentMention(bodyText: string): boolean {
  if (!bodyText) return false;
  // Strip HTML tags to get plain text for keyword scanning.
  const text = bodyText
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .toLowerCase();
  return ATTACHMENT_KEYWORDS.some((kw) => text.includes(kw));
}
