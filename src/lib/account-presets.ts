/**
 * Static presets + validation for add-account-modal.
 * Extracted Sprint 10 to keep the modal component focused on UI.
 */
import type { AccountProvider, AccountServerConfig } from "@/types/account";

export const ACCOUNT_COLORS: string[] = [
  "#3b5bff",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

/** Default IMAP/SMTP presets per provider. */
export const PROVIDER_PRESETS: Record<
  AccountProvider,
  {
    label: string;
    serverConfig?: AccountServerConfig;
    needsServerFields: boolean;
  }
> = {
  gmail: {
    label: "Gmail",
    needsServerFields: false,
    serverConfig: {
      imapHost: "imap.gmail.com",
      imapPort: 993,
      imapSecurity: "ssl",
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      smtpSecurity: "ssl",
    },
  },
  outlook: {
    label: "Outlook",
    needsServerFields: false,
    serverConfig: {
      imapHost: "outlook.office365.com",
      imapPort: 993,
      imapSecurity: "ssl",
      smtpHost: "smtp.office365.com",
      smtpPort: 587,
      smtpSecurity: "starttls",
    },
  },
  proton: {
    label: "Proton",
    needsServerFields: false,
    serverConfig: {
      imapHost: "127.0.0.1",
      imapPort: 1143,
      imapSecurity: "starttls",
      smtpHost: "127.0.0.1",
      smtpPort: 1025,
      smtpSecurity: "starttls",
    },
  },
  misfits: {
    label: "misfits.ai",
    needsServerFields: false,
    serverConfig: {
      imapHost: "imap.misfits.ai",
      imapPort: 993,
      imapSecurity: "ssl",
      smtpHost: "smtp.misfits.ai",
      smtpPort: 465,
      smtpSecurity: "ssl",
    },
  },
  custom: {
    label: "Custom (IMAP/SMTP)",
    needsServerFields: true,
    serverConfig: {
      imapHost: "",
      imapPort: 993,
      imapSecurity: "ssl",
      smtpHost: "",
      smtpPort: 587,
      smtpSecurity: "starttls",
    },
  },
};

export const SECURITY_OPTIONS: {
  value: AccountServerConfig["imapSecurity"];
  label: string;
}[] = [
  { value: "ssl", label: "SSL/TLS" },
  { value: "starttls", label: "STARTTLS" },
  { value: "none", label: "None" },
];

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Validate the entered server config + credentials (real client-side checks). */
export function validateConnection(
  email: string,
  password: string,
  serverConfig: AccountServerConfig
): ValidationResult {
  const errors: string[] = [];
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) errors.push("Enter a valid email address.");
  if (!password) errors.push("Password / app password is required.");

  if (!serverConfig.imapHost.trim()) errors.push("IMAP host is required.");
  if (!serverConfig.smtpHost.trim()) errors.push("SMTP host is required.");
  if (
    !Number.isInteger(serverConfig.imapPort) ||
    serverConfig.imapPort < 1 ||
    serverConfig.imapPort > 65535
  ) {
    errors.push("IMAP port must be between 1 and 65535.");
  }
  if (
    !Number.isInteger(serverConfig.smtpPort) ||
    serverConfig.smtpPort < 1 ||
    serverConfig.smtpPort > 65535
  ) {
    errors.push("SMTP port must be between 1 and 65535.");
  }
  return { ok: errors.length === 0, errors };
}

