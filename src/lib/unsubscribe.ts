/**
 * One-click unsubscribe utility (Issue #541).
 *
 * Implements RFC 8058 (one-click unsubscribe) and RFC 2369 (List-Unsubscribe header).
 * Supports both mailto: and HTTPS unsubscribe methods.
 */

export type UnsubscribeMethod = "mailto" | "https";

export interface UnsubscribeInfo {
  /** The unsubscribe URL or mailto address */
  url: string;
  /** The method type */
  method: UnsubscribeMethod;
  /** Whether this is a one-click unsubscribe (RFC 8058) */
  isOneClick: boolean;
}

export interface UnsubscribeResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface UnsubscribeLogEntry {
  id: string;
  emailId: string;
  listId: string;
  method: UnsubscribeMethod;
  timestamp: string;
  success: boolean;
}

/**
 * Generate a List-Unsubscribe header value.
 */
export function generateListUnsubscribeHeader(options: {
  mailto?: string;
  url?: string;
}): string {
  const parts: string[] = [];

  if (options.mailto) {
    parts.push(`<mailto:${options.mailto}>`);
  }

  if (options.url) {
    parts.push(`<${options.url}>`);
  }

  return parts.join(", ");
}

/**
 * Generate a full List-Unsubscribe header with one-click support (RFC 8058).
 */
export function generateOneClickUnsubscribeHeader(options: {
  mailto?: string;
  url?: string;
  postData?: string;
}): string {
  const parts: string[] = [];

  if (options.mailto) {
    parts.push(`<mailto:${options.mailto}>`);
  }

  if (options.url) {
    let urlPart = `<${options.url}>`;
    if (options.postData) {
      urlPart += ` (One-Click)`;
    }
    parts.push(urlPart);
  }

  return parts.join(", ");
}

/**
 * Parse a List-Unsubscribe header value.
 */
export function parseListUnsubscribeHeader(header: string): UnsubscribeInfo[] {
  const results: UnsubscribeInfo[] = [];
  const regex = /<([^>]+)>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(header)) !== null) {
    const value = match[1];

    if (value.startsWith("mailto:")) {
      results.push({
        url: value,
        method: "mailto",
        isOneClick: header.includes("One-Click"),
      });
    } else {
      results.push({
        url: value,
        method: "https",
        isOneClick: header.includes("One-Click"),
      });
    }
  }

  return results;
}

/**
 * Check if an email contains a valid unsubscribe header.
 */
export function hasUnsubscribeHeader(header: string | undefined): boolean {
  if (!header) return false;
  return header.includes("mailto:") || header.includes("http");
}

/**
 * Generate an unsubscribe confirmation email body.
 */
export function generateUnsubscribeConfirmation(options: {
  recipientEmail: string;
  listName: string;
  resubscribeUrl?: string;
}): string {
  let body = `You have been successfully unsubscribed from "${options.listName}".`;

  if (options.resubscribeUrl) {
    body += `\n\nIf this was a mistake, you can resubscribe here: ${options.resubscribeUrl}`;
  }

  body += `\n\nThis action was taken at ${new Date().toISOString()}`;

  return body;
}

/**
 * Generate a unique unsubscribe URL for a mailing list.
 */
export function generateUnsubscribeUrl(options: {
  baseUrl: string;
  listId: string;
  recipientEmail: string;
  token?: string;
}): string {
  const params = new URLSearchParams();
  params.set("list", options.listId);
  params.set("email", options.recipientEmail);
  if (options.token) {
    params.set("token", options.token);
  }

  return `${options.baseUrl}/unsubscribe?${params.toString()}`;
}

/**
 * Generate an unsubscribe token for verification.
 */
export function generateUnsubscribeToken(email: string, listId: string): string {
  const data = `${email}:${listId}:${Date.now()}`;
  return btoa(data).replace(/=/g, "").slice(0, 32);
}

/**
 * Verify an unsubscribe token is valid.
 */
export function verifyUnsubscribeToken(token: string, email: string, listId: string): boolean {
  try {
    const decoded = atob(token);
    return decoded.startsWith(`${email}:${listId}:`);
  } catch {
    return false;
  }
}

/**
 * Create an unsubscribe log entry.
 */
export function createUnsubscribeLogEntry(entry: Omit<UnsubscribeLogEntry, "id" | "timestamp">): UnsubscribeLogEntry {
  return {
    ...entry,
    id: `unsub-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check compliance requirements for unsubscribe.
 */
export function checkUnsubscribeCompliance(options: {
  hasListUnsubscribe: boolean;
  hasOneClick: boolean;
  isCommercial: boolean;
}): {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!options.hasListUnsubscribe) {
    issues.push("Missing List-Unsubscribe header (required for bulk senders)");
    recommendations.push("Add List-Unsubscribe header to all outgoing emails");
  }

  if (options.isCommercial && !options.hasOneClick) {
    recommendations.push("Consider implementing one-click unsubscribe (RFC 8058) for commercial emails");
  }

  return {
    compliant: options.hasListUnsubscribe,
    issues,
    recommendations,
  };
}
