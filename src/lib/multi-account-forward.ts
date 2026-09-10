/**
 * Multi-account email forwarding (Issue #479).
 *
 * Supports forwarding emails to another connected account,
 * with account selection dropdown and forward-as-attachment option.
 */

export interface ForwardOptions {
  to: string;
  fromAccountId: string;
  asAttachment: boolean;
  includeAttachments: boolean;
  message?: string;
}

export interface ForwardResult {
  success: boolean;
  forwardId: string;
  fromAccount: string;
  to: string;
  timestamp: string;
  message: string;
}

/**
 * Create forward options with defaults.
 */
export function createForwardOptions(to: string, accountId: string): ForwardOptions {
  return {
    to,
    fromAccountId: accountId,
    asAttachment: false,
    includeAttachments: true,
  };
}

/**
 * Validate forward options.
 */
export function validateForwardOptions(options: ForwardOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.to.trim()) {
    errors.push("Recipient is required");
  }

  if (!options.fromAccountId) {
    errors.push("From account is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available accounts for forwarding.
 */
export function getForwardableAccounts(
  accounts: Array<{ id: string; email: string; name?: string; color: string; isActive: boolean }>
): Array<{ id: string; email: string; name?: string; color: string }> {
  return accounts.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    color: a.color,
  }));
}

/**
 * Get active account ID.
 */
export function getActiveAccountId(
  accounts: Array<{ id: string; isActive: boolean }>
): string | undefined {
  return accounts.find((a) => a.isActive)?.id;
}

/**
 * Check if user has multiple accounts.
 */
export function hasMultipleAccounts(accounts: Array<{ id: string }>): boolean {
  return accounts.length > 1;
}

/**
 * Get account color dot HTML.
 */
export function getAccountColorDot(color: string): string {
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color}"></span>`;
}

/**
 * Format account label for display.
 */
export function formatAccountLabel(account: { email: string; name?: string }): string {
  return account.name ? `${account.name} <${account.email}>` : account.email;
}

/**
 * Create forward result.
 */
export function createForwardResult(options: ForwardOptions): ForwardResult {
  return {
    success: true,
    forwardId: `fwd-${Date.now()}`,
    fromAccount: options.fromAccountId,
    to: options.to,
    timestamp: new Date().toISOString(),
    message: options.asAttachment ? "Forwarded as attachment" : "Forwarded",
  };
}
