/**
 * Newsletter one-click unsubscribe (RFC 2369 List-Unsubscribe header)
 *
 * Parses the List-Unsubscribe header from emails and provides
 * a one-click unsubscribe action to the user.
 */

export interface UnsubscribeInfo {
  url: string;
  email?: string;
  isMailto: boolean;
  isOneClick: boolean;
}

/**
 * Parse List-Unsubscribe header
 * Format: <mailto:unsubscribe@example.com>, <https://example.com/unsubscribe>
 */
export function parseUnsubscribeHeader(header: string): UnsubscribeInfo | null {
  if (!header) return null;

  const urlMatch = header.match(/<([^>]+)>/);
  if (!urlMatch) return null;

  const url = urlMatch[1];
  const isMailto = url.toLowerCase().startsWith('mailto:');
  const isOneClick = header.toLowerCase().includes('list-unsubscribe-post');

  return {
    url,
    email: isMailto ? url.replace('mailto:', '') : undefined,
    isMailto,
    isOneClick,
  };
}

/**
 * Validate unsubscribe URL for safety
 */
export function isUnsubscribeUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Execute unsubscribe request
 * Returns true on success, false on failure
 */
export async function executeUnsubscribe(info: UnsubscribeInfo): Promise<boolean> {
  if (!isUnsubscribeUrlSafe(info.url)) return false;

  if (info.isMailto) {
    // For mailto links, open mail client
    window.location.href = info.url;
    return true;
  }

  if (info.isOneClick) {
    // RFC 8058 one-click unsubscribe
    const response = await fetch(info.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    });
    return response.ok;
  }

  // GET request to unsubscribe URL
  const response = await fetch(info.url);
  return response.ok;
}

/**
 * Get unsubscribe link from email headers (for display)
 */
export function getUnsubscribeLink(headers: Record<string, string>): string | null {
  const header = headers['list-unsubscribe'] || headers['List-Unsubscribe'];
  if (!header) return null;

  const info = parseUnsubscribeHeader(header);
  return info?.url ?? null;
}
