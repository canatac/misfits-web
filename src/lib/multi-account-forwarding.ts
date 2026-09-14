/**
 * multi-account-forwarding.ts — forwarding rule engine.
 *
 * Manages rules for auto-forwarding incoming mail to a target address,
 * scoped per source account. Supports enable/disable, pattern matching.
 */

export interface ForwardingRule {
  id: string;
  accountId: string;
  targetEmail: string;
  pattern: string | null; // substring match on subject; null = match all
  enabled: boolean;
  createdAt: number;
}

export interface ForwardMatch {
  rule: ForwardingRule;
  matched: boolean;
}

export function createRule(
  accountId: string,
  targetEmail: string,
  pattern: string | null = null
): ForwardingRule {
  return {
    id: `${accountId}-${Date.now()}`,
    accountId,
    targetEmail,
    pattern,
    enabled: true,
    createdAt: Date.now(),
  };
}

/** Evaluate whether a message subject matches a rule. */
export function matchesRule(rule: ForwardingRule, subject: string): boolean {
  if (!rule.enabled) return false;
  if (!rule.pattern) return true;
  return subject.toLowerCase().includes(rule.pattern.toLowerCase());
}

/**
 * Given a list of rules and a message, return which rules match.
 * Rules belonging to other accounts are skipped.
 */
export function findMatchingRules(
  rules: ForwardingRule[],
  accountId: string,
  subject: string
): ForwardingRule[] {
  return rules.filter((r) => r.accountId === accountId && matchesRule(r, subject));
}

/** Toggle a rule on/off by id; returns new array. */
export function toggleRule(rules: ForwardingRule[], id: string): ForwardingRule[] {
  return rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
}
