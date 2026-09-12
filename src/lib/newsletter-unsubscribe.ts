export interface UnsubscribeToken { email: string; newsletterId: string; signature: string; expiresAt: number }
export interface UnsubscribeResult { success: boolean; newsletterId: string; preferencesRetained: boolean }
export interface BulkUnsubscribeResult { total: number; succeeded: number; failed: number; results: UnsubscribeResult[] }

export function generateUnsubscribeToken(email: string, newsletterId: string, ttlMs: number = 86400000): UnsubscribeToken {
  const expiresAt = Date.now() + ttlMs;
  return { email, newsletterId, signature: `${email}:${newsletterId}:${expiresAt}`, expiresAt };
}

export function isTokenValid(token: UnsubscribeToken): boolean { return token.expiresAt > Date.now(); }

export function parseUnsubscribeToken(payload: string): UnsubscribeToken | null {
  try {
    const d = JSON.parse(decodeURIComponent(payload));
    if (typeof d.email !== "string" || typeof d.newsletterId !== "string" || typeof d.expiresAt !== "number") return null;
    return d;
  } catch { return null; }
}

export function buildUnsubscribeUrl(baseUrl: string, token: UnsubscribeToken): string {
  return `${baseUrl}/unsubscribe?token=${encodeURIComponent(JSON.stringify(token))}`;
}

export function processUnsubscribe(token: UnsubscribeToken, retainPreferences: boolean = true): UnsubscribeResult {
  if (!isTokenValid(token)) return { success: false, newsletterId: token.newsletterId, preferencesRetained: false };
  return { success: true, newsletterId: token.newsletterId, preferencesRetained: retainPreferences };
}

export function bulkUnsubscribe(tokens: UnsubscribeToken[], retainPreferences: boolean = true): BulkUnsubscribeResult {
  const results = tokens.map(t => processUnsubscribe(t, retainPreferences));
  return { total: tokens.length, succeeded: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
}

export function formatUnsubscribeConfirmation(result: UnsubscribeResult): string {
  return result.success ? `Successfully unsubscribed from ${result.newsletterId}.` : `Failed to unsubscribe from ${result.newsletterId}. Token may be expired.`;
}
