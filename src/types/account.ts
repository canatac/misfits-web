/**
 * Multi-account & unified inbox types for misfits.ai Mail (Issue #154).
 *
 * An EmailAccount represents a single connected mailbox (provider, credentials,
 * color, aliases). The UnifiedInboxConfig controls whether the email list merges
 * emails from every account or only shows the currently-selected one.
 */

/** Email providers supported by the multi-account connector. */
export type AccountProvider = "gmail" | "outlook" | "proton" | "custom" | "misfits";

/** IMAP/SMTP server configuration for a connected account. */
export interface AccountServerConfig {
  imapHost: string;
  imapPort: number;
  imapSecurity: "none" | "ssl" | "starttls";
  smtpHost: string;
  smtpPort: number;
  smtpSecurity: "none" | "ssl" | "starttls";
}

/** A single connected email account. */
export interface EmailAccount {
  /** Unique stable identifier (e.g. "acc-1"). */
  id: string;
  /** The primary email address for this account. */
  email: string;
  /** Display name shown in the UI (derived from email local-part if omitted). */
  name?: string;
  /** Provider driving default server presets and branding. */
  provider: AccountProvider;
  /** Accent color used for the account dot/badge. */
  color: string;
  /** Optional avatar URL or single-character fallback. */
  avatar?: string;
  /** Whether this account is the default (used for composing, primary inbox). */
  isDefault: boolean;
  /** Alternate addresses that deliver into this account's inbox. */
  aliases: string[];
  /** IMAP/SMTP server settings (present for custom/IMAP providers). */
  serverConfig?: AccountServerConfig;
  /** ISO timestamp the account was connected. */
  connectedAt: string;
}

/** Configuration for the unified inbox view. */
export interface UnifiedInboxConfig {
  /** When true the email list merges every account; false shows only the active one. */
  enabled: boolean;
  /** Account ids included in the unified view (empty = all accounts). */
  accountIds: string[];
}
