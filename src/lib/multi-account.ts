/**
 * Multi-account aggregation utilities for unified inbox (Issue #527).
 *
 * Provides helpers for account management, unified inbox filtering,
 * and cross-account search/compose functionality.
 */

import type { EmailAccount, AccountProvider, AccountServerConfig } from "@/types/account";
import type { Email } from "@/types/email";

/** Provider presets for common email services. */
export const PROVIDER_PRESETS: Record<Exclude<AccountProvider, "custom" | "misfits">, {
  label: string;
  imapHost: string;
  imapPort: number;
  imapSecurity: "ssl" | "starttls";
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: "ssl" | "starttls";
  color: string;
}> = {
  gmail: {
    label: "Gmail",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    imapSecurity: "ssl",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecurity: "starttls",
    color: "#EA4335",
  },
  outlook: {
    label: "Outlook",
    imapHost: "outlook.office365.com",
    imapPort: 993,
    imapSecurity: "ssl",
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    smtpSecurity: "starttls",
    color: "#0078D4",
  },
  proton: {
    label: "Proton Mail",
    imapHost: "127.0.0.1",
    imapPort: 1143,
    imapSecurity: "ssl",
    smtpHost: "127.0.0.1",
    smtpPort: 1025,
    smtpSecurity: "ssl",
    color: "#8B89CC",
  },
};

/** Account tier limits. */
export const TIER_LIMITS = {
  free: { maxAccounts: 1, maxExternal: 0 },
  pro: { maxAccounts: 4, maxExternal: 3 },
  admin: { maxAccounts: 99, maxExternal: 99 },
};

export type AccountTier = keyof typeof TIER_LIMITS;

/**
 * Get the server config for a provider preset.
 */
export function getProviderPreset(provider: AccountProvider): {
  imapHost: string;
  imapPort: number;
  imapSecurity: "ssl" | "starttls";
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: "ssl" | "starttls";
} | null {
  if (provider === "custom" || provider === "misfits") return null;
  return PROVIDER_PRESETS[provider];
}

/**
 * Build a server config from provider preset.
 */
export function buildServerConfig(provider: AccountProvider): AccountServerConfig | undefined {
  const preset = getProviderPreset(provider);
  if (!preset) return undefined;
  return {
    imapHost: preset.imapHost,
    imapPort: preset.imapPort,
    imapSecurity: preset.imapSecurity,
    smtpHost: preset.smtpHost,
    smtpPort: preset.smtpPort,
    smtpSecurity: preset.smtpSecurity,
  };
}

/**
 * Check if an account can be added given current accounts and tier.
 */
export function canAddAccount(
  currentAccounts: EmailAccount[],
  tier: AccountTier = "pro"
): { allowed: boolean; reason?: string } {
  const limits = TIER_LIMITS[tier];
  const externalCount = currentAccounts.filter((a) => a.provider !== "misfits").length;

  if (currentAccounts.length >= limits.maxAccounts) {
    return {
      allowed: false,
      reason: `Account limit reached (${limits.maxAccounts} for ${tier} tier)`,
    };
  }

  if (externalCount >= limits.maxExternal) {
    return {
      allowed: false,
      reason: `External account limit reached (${limits.maxExternal} for ${tier} tier)`,
    };
  }

  return { allowed: true };
}

/**
 * Filter emails for unified inbox (all accounts) or single account.
 */
export function filterEmailsByAccount(
  emails: Email[],
  accounts: EmailAccount[],
  options: {
    unified: boolean;
    accountId?: string | null;
  }
): Email[] {
  if (options.unified) {
    // Show all emails from all accounts
    return emails;
  }

  if (options.accountId) {
    // Show emails from specific account
    return emails.filter((e) => e.accountId === options.accountId);
  }

  // Show default account emails
  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0];
  if (!defaultAccount) return emails;
  return emails.filter((e) => e.accountId === defaultAccount.id);
}

/**
 * Get the account badge info for an email.
 */
export function getEmailAccountBadge(
  email: Email,
  accounts: EmailAccount[]
): { name: string; color: string } | null {
  if (!email.accountId) return null;
  const account = accounts.find((a) => a.id === email.accountId);
  if (!account) return null;
  return { name: account.name ?? account.email, color: account.color };
}

/**
 * Group emails by account for unified inbox display.
 */
export function groupEmailsByAccount(
  emails: Email[],
  accounts: EmailAccount[]
): Array<{ account: EmailAccount | null; emails: Email[] }> {
  const groups = new Map<string, Email[]>();

  for (const email of emails) {
    const key = email.accountId ?? "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(email);
  }

  const result: Array<{ account: EmailAccount | null; emails: Email[] }> = [];

  for (const [accountId, accountEmails] of groups) {
    const account = accounts.find((a) => a.id === accountId) ?? null;
    result.push({ account, emails: accountEmails });
  }

  // Sort groups: misfits first, then alphabetical
  result.sort((a, b) => {
    if (a.account?.provider === "misfits") return -1;
    if (b.account?.provider === "misfits") return 1;
    return (a.account?.name ?? "").localeCompare(b.account?.name ?? "");
  });

  return result;
}

/**
 * Count emails per account for badge display.
 */
export function countEmailsPerAccount(
  emails: Email[],
  accounts: EmailAccount[]
): Map<string, number> {
  const counts = new Map<string, number>();

  // Initialize all accounts with 0
  for (const account of accounts) {
    counts.set(account.id, 0);
  }

  // Count emails
  for (const email of emails) {
    if (email.accountId) {
      counts.set(email.accountId, (counts.get(email.accountId) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Get the provider label for display.
 */
export function getProviderLabel(provider: AccountProvider): string {
  if (provider === "custom") return "Custom IMAP";
  if (provider === "misfits") return "misfits.ai";
  return PROVIDER_PRESETS[provider]?.label ?? provider;
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Get the next available color for a new account.
 */
export function getNextAccountColor(existingAccounts: EmailAccount[]): string {
  const colors = ["#3b5bff", "#EA4335", "#0078D4", "#8B89CC", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const usedColors = new Set(existingAccounts.map((a) => a.color));
  return colors.find((c) => !usedColors.has(c)) ?? colors[existingAccounts.length % colors.length];
}
