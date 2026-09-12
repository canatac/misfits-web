/**
 * Smart Notifications and Sender Gatekeeper (Focus Mode)
 *
 * Allows users to:
 * - Define notification rules based on sender, subject keywords, and folders
 * - Enable "Focus Mode" which suppresses all but priority notifications
 * - Maintain a sender whitelist/blacklist for notifications
 */

export interface NotificationRule {
  id: string;
  type: 'allow' | 'block';
  field: 'sender' | 'subject' | 'folder';
  pattern: string;
  enabled: boolean;
}

export interface NotificationContext {
  sender: string;
  subject: string;
  folder: string;
  isStarred?: boolean;
  hasAttachment?: boolean;
  bodyPreview?: string;
}

export function createRule(
  type: NotificationRule['type'],
  field: NotificationRule['field'],
  pattern: string
): NotificationRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    field,
    pattern: pattern.toLowerCase(),
    enabled: true,
  };
}

export function shouldNotify(
  context: NotificationContext,
  rules: NotificationRule[],
  focusMode: boolean
): boolean {
  // In focus mode, only allow whitelisted senders or starred emails
  if (focusMode) {
    const allowedInFocus = rules.some(
      r => r.enabled && r.type === 'allow' && r.field === 'sender' &&
        matchesPattern(context.sender, r.pattern)
    );
    const isStarred = context.isStarred === true;
    return allowedInFocus || isStarred;
  }

  // Normal mode: check block rules first
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const value = getFieldValue(context, rule.field);
    if (!value) continue;

    const matches = matchesPattern(value, rule.pattern);

    if (rule.type === 'block' && matches) return false;
    if (rule.type === 'allow' && matches) return true;
  }

  // No matching rules: default to notify
  return true;
}

export function filterNotifications(
  contexts: NotificationContext[],
  rules: NotificationRule[],
  focusMode: boolean
): NotificationContext[] {
  return contexts.filter(ctx => shouldNotify(ctx, rules, focusMode));
}

export function isSenderWhitelisted(
  sender: string,
  rules: NotificationRule[]
): boolean {
  return rules.some(
    r => r.enabled && r.type === 'allow' && r.field === 'sender' &&
      matchesPattern(sender, r.pattern)
  );
}

export function isSenderBlacklisted(
  sender: string,
  rules: NotificationRule[]
): boolean {
  return rules.some(
    r => r.enabled && r.type === 'block' && r.field === 'sender' &&
      matchesPattern(sender, r.pattern)
  );
}

function getFieldValue(context: NotificationContext, field: NotificationRule['field']): string {
  switch (field) {
    case 'sender':
      return context.sender.toLowerCase();
    case 'subject':
      return context.subject.toLowerCase();
    case 'folder':
      return context.folder.toLowerCase();
    default:
      return '';
  }
}

function matchesPattern(value: string, pattern: string): boolean {
  if (!value || !pattern) return false;

  // Support wildcard patterns
  if (pattern.includes('*')) {
    const regex = new RegExp(
      '^' + pattern.split('*').map(escapeRegex).join('.*') + '$',
      'i'
    );
    return regex.test(value);
  }

  return value.includes(pattern);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
