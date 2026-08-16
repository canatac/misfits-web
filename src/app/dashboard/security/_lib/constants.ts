export type LlmProvider =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "groq"
  | "custom";

export const LLM_PROVIDER_OPTIONS: readonly LlmProvider[] = [
  "openrouter",
  "openai",
  "anthropic",
  "groq",
  "custom",
] as const;

export type MailboxSecret = {
  imapLogin: string;
  imapPassword: string;
  smtpLogin: string;
  smtpPassword: string;
};

export type MailboxSecretMap = Record<string, MailboxSecret>;
export type LlmSecrets = Record<LlmProvider, string>;

export const STORAGE_MAILBOX_KEYS = "misfits.security.mailbox-secrets";
export const STORAGE_LLM_KEYS = "misfits.security.llm-secrets";
export const STORAGE_LLM_PROVIDER = "misfits.security.llm-provider";

import type { UserRole } from "@/types/auth";
import type { EmailAccount } from "@/types/account";

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "user", label: "Utilisateur" },
  { value: "support", label: "Support" },
  { value: "admin", label: "Admin" },
];

export function makeAvatarOptions(seed: string): string[] {
  const sanitized =
    seed.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") || "user";
  return Array.from(
    { length: 8 },
    (_, idx) =>
      `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(`${sanitized}-${idx + 1}`)}`,
  );
}

export function maskSecret(value: string): string {
  if (!value) return "—";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}

export function serverConfigLabel(account: EmailAccount): string {
  const c = account.serverConfig;
  if (!c) return "Preset provider";
  return `IMAP ${c.imapHost}:${c.imapPort} (${c.imapSecurity}) • SMTP ${c.smtpHost}:${c.smtpPort} (${c.smtpSecurity})`;
}
