/**
 * External IMAP accounts API client.
 *
 * Wraps POST /api/external-accounts, POST /api/external-accounts/{id}/test,
 * POST /api/external-accounts/{id}/sync (mode=incremental, since=<ISO>).
 *
 * The backend is a Rust actix-web service (reimagined-guide). The Next.js
 * apiClient injects `x-user-id`, `x-user-email` and `Authorization` headers
 * from the current session.
 */
import { apiClient } from "@/lib/api-client";
import type { AccountProvider, AccountServerConfig } from "@/types/account";

export interface ExternalImapServerConfig {
  host: string;
  port: number;
  tls: boolean;
}

export interface ExternalSmtpServerConfig {
  host?: string;
  port?: number;
  tls?: boolean;
}

export interface ExternalAccountCredentials {
  secretValue?: string;
  secretRef?: string;
}

export interface CreateExternalAccountInput {
  provider: string;
  email: string;
  authType: string;
  imap: ExternalImapServerConfig;
  smtp?: ExternalSmtpServerConfig;
  credentials?: ExternalAccountCredentials;
}

export interface ExternalImapAccount {
  id: string;
  ownerUserId: string;
  provider: string;
  email: string;
  authType: string;
  imapHost: string;
  imapPort: number;
  imapTls: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpTls?: boolean | null;
  status: string;
  lastSyncAt?: string | null;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImapTestResult {
  ok: boolean;
  capabilities: string[];
  greeting: string;
  message: string;
}

export interface StartSyncInput {
  /** "incremental" | "full" | "backfill" */
  mode: string;
  folders?: string[];
  /** ISO-8601. When omitted the backend syncs everything (heavy). */
  since?: string;
}

export interface StartSyncResult {
  runId: string;
  status: string;
  run: unknown;
}

/** Map the UI's AccountServerConfig into the backend's ExternalImap payload. */
export function toCreatePayload(args: {
  email: string;
  provider: AccountProvider;
  serverConfig: AccountServerConfig;
  password: string;
}): CreateExternalAccountInput {
  const { email, provider, serverConfig, password } = args;
  return {
    provider,
    email,
    authType: "password",
    imap: {
      host: serverConfig.imapHost,
      port: serverConfig.imapPort,
      tls: serverConfig.imapSecurity !== "none",
    },
    smtp: {
      host: serverConfig.smtpHost || undefined,
      port: serverConfig.smtpPort || undefined,
      tls: serverConfig.smtpSecurity !== "none",
    },
    credentials: { secretValue: password },
  };
}

export function createExternalAccount(
  payload: CreateExternalAccountInput
): Promise<ExternalImapAccount> {
  return apiClient.post<ExternalImapAccount>("/external-accounts", payload);
}

export function testExternalAccount(id: string): Promise<ImapTestResult> {
  return apiClient.post<ImapTestResult>(
    `/external-accounts/${encodeURIComponent(id)}/test`,
    {}
  );
}

export function startExternalAccountSync(
  id: string,
  input: StartSyncInput
): Promise<StartSyncResult> {
  return apiClient.post<StartSyncResult>(
    `/external-accounts/${encodeURIComponent(id)}/sync`,
    input
  );
}

export function deleteExternalAccount(
  id: string
): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(
    `/external-accounts/${encodeURIComponent(id)}`
  );
}

/** Start-of-day ISO for "sync today only" — matches user requirement. */
export function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
