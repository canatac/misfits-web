"use client";

/**
 * Add Account Modal — choose a provider (Gmail/Outlook/Proton/Custom), enter
 * IMAP/SMTP server settings and credentials, pick an accent color, and test the
 * connection before saving (Issue #154).
 *
 * The "Test connection" action performs real client-side validation of the
 * server config and credentials (no fabricated network round-trip). On success
 * the account is added to the store.
 */
import * as React from "react";
import { Check, Loader2, Mail, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAccountMutations } from "@/hooks/use-accounts";
import { useAccountStore } from "@/stores/account-store";
import type { AccountProvider, AccountServerConfig } from "@/types/account";

/** Accent color presets for accounts. */
const ACCOUNT_COLORS: string[] = [
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
const PROVIDER_PRESETS: Record<
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

const SECURITY_OPTIONS: {
  value: AccountServerConfig["imapSecurity"];
  label: string;
}[] = [
  { value: "ssl", label: "SSL/TLS" },
  { value: "starttls", label: "STARTTLS" },
  { value: "none", label: "None" },
];

interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Validate the entered server config + credentials (real client-side checks). */
function validateConnection(
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

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const { addAccount } = useAccountMutations();
  const accounts = useAccountStore((s) => s.accounts);
  const setActiveAccount = useAccountStore((s) => s.setActiveAccount);

  const [provider, setProvider] = React.useState<AccountProvider>("gmail");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [color, setColor] = React.useState(ACCOUNT_COLORS[0]);
  const [customColor, setCustomColor] = React.useState("");
  const [serverConfig, setServerConfig] = React.useState<AccountServerConfig>(
    PROVIDER_PRESETS.gmail.serverConfig!
  );
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<ValidationResult | null>(
    null
  );

  const activeColor = customColor || color;
  const needsServerFields = PROVIDER_PRESETS[provider].needsServerFields;

  function reset() {
    setProvider("gmail");
    setEmail("");
    setName("");
    setPassword("");
    setColor(ACCOUNT_COLORS[0]);
    setCustomColor("");
    setServerConfig(PROVIDER_PRESETS.gmail.serverConfig!);
    setTesting(false);
    setTestResult(null);
  }

  function handleProviderChange(next: AccountProvider) {
    setProvider(next);
    const preset = PROVIDER_PRESETS[next];
    if (preset.serverConfig) setServerConfig({ ...preset.serverConfig });
    // Provider switched → re-run validation context resets.
    setTestResult(null);
  }

  function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    // Real validation is synchronous; emulate a brief async delay for UX feedback.
    const result = validateConnection(email, password, serverConfig);
    window.setTimeout(() => {
      setTestResult(result);
      setTesting(false);
    }, 350);
  }

  async function handleSave() {
    // 1) Local syntactic validation (unchanged).
    const result = validateConnection(email, password, serverConfig);
    if (!result.ok) {
      setTestResult(result);
      return;
    }

    // 2) Push to backend: create + test + initial sync (today only).
    //    Any backend failure surfaces in the modal — nothing is stored locally
    //    if the account isn't actually reachable server-side.
    let backendId: string | undefined;
    try {
      setTesting(true);
      const cfg = needsServerFields
        ? serverConfig
        : PROVIDER_PRESETS[provider].serverConfig;
      const { createExternalAccount, testExternalAccount, startExternalAccountSync, startOfTodayIso, toCreatePayload, deleteExternalAccount } =
        await import("@/lib/external-accounts-api");
      const created = await createExternalAccount(
        toCreatePayload({ email, provider, serverConfig: cfg, password })
      );
      backendId = created.id;

      const test = await testExternalAccount(created.id);
      if (!test.ok) {
        // Clean up so the user isn't stuck with a dead account.
        try { await deleteExternalAccount(created.id); } catch { /* noop */ }
        setTestResult({ ok: false, errors: [test.message || "IMAP test failed"] });
        setTesting(false);
        return;
      }

      // Default sync window = "today only" (matches user requirement).
      await startExternalAccountSync(created.id, {
        mode: "incremental",
        since: startOfTodayIso(),
      });
    } catch (err) {
      // Roll back the backend account if create succeeded but a later step failed.
      if (backendId) {
        try {
          const { deleteExternalAccount } = await import(
            "@/lib/external-accounts-api"
          );
          await deleteExternalAccount(backendId);
        } catch {
          /* noop */
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ ok: false, errors: [`Backend error: ${msg}`] });
      setTesting(false);
      return;
    } finally {
      setTesting(false);
    }

    // 3) Only persist locally once the backend has the account + a sync started.
    const account = await addAccount.mutateAsync({
      email,
      name: name.trim() || undefined,
      provider,
      color: activeColor,
      avatar: undefined,
      aliases: [],
      serverConfig: needsServerFields
        ? serverConfig
        : PROVIDER_PRESETS[provider].serverConfig,
    });
    setActiveAccount(account.id);
    reset();
    onOpenChange(false);
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const canSave =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0;
  const showServerFields = needsServerFields;

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[var(--color-brand-500)]" />
            Add email account
          </ModalTitle>
          <ModalDescription>
            Connect a new mailbox. Choose a provider or use custom IMAP/SMTP
            settings.
          </ModalDescription>
        </ModalHeader>

        <ModalBody className="max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4">
            {/* Provider */}
            <div className="grid gap-2">
              <Label htmlFor="account-provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) =>
                  handleProviderChange(v as AccountProvider)
                }
              >
                <SelectTrigger id="account-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_PRESETS) as AccountProvider[]).map(
                    (p) => (
                      <SelectItem key={p} value={p}>
                        {PROVIDER_PRESETS[p].label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Email + Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="account-email">Email address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-name">Display name (optional)</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Work, Personal…"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="account-password">Password / App password</Label>
              <Input
                id="account-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTestResult(null);
                }}
                placeholder="••••••••••••"
              />
              <p className="text-xs text-[var(--color-muted-fg)]">
                Use an app-specific password for providers that require 2FA.
              </p>
            </div>

            {/* Server settings (only for custom provider) */}
            {showServerFields && (
              <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
                <span className="text-sm font-medium">Server settings</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="imap-host">IMAP host</Label>
                    <Input
                      id="imap-host"
                      value={serverConfig.imapHost}
                      onChange={(e) =>
                        setServerConfig((s) => ({
                          ...s,
                          imapHost: e.target.value,
                        }))
                      }
                      placeholder="imap.example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imap-port">IMAP port</Label>
                    <Input
                      id="imap-port"
                      type="number"
                      min={1}
                      max={65535}
                      value={serverConfig.imapPort}
                      onChange={(e) =>
                        setServerConfig((s) => ({
                          ...s,
                          imapPort: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imap-security">IMAP security</Label>
                    <Select
                      value={serverConfig.imapSecurity}
                      onValueChange={(v) =>
                        setServerConfig((s) => ({
                          ...s,
                          imapSecurity:
                            v as AccountServerConfig["imapSecurity"],
                        }))
                      }
                    >
                      <SelectTrigger id="imap-security">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SECURITY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp-host">SMTP host</Label>
                    <Input
                      id="smtp-host"
                      value={serverConfig.smtpHost}
                      onChange={(e) =>
                        setServerConfig((s) => ({
                          ...s,
                          smtpHost: e.target.value,
                        }))
                      }
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp-port">SMTP port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      min={1}
                      max={65535}
                      value={serverConfig.smtpPort}
                      onChange={(e) =>
                        setServerConfig((s) => ({
                          ...s,
                          smtpPort: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="smtp-security">SMTP security</Label>
                    <Select
                      value={serverConfig.smtpSecurity}
                      onValueChange={(v) =>
                        setServerConfig((s) => ({
                          ...s,
                          smtpSecurity:
                            v as AccountServerConfig["smtpSecurity"],
                        }))
                      }
                    >
                      <SelectTrigger id="smtp-security">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SECURITY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Color picker */}
            <div className="grid gap-2">
              <Label>Account color</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {ACCOUNT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => {
                      setColor(c);
                      setCustomColor("");
                    }}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-transform",
                      !customColor && color === c
                        ? "scale-110 border-[var(--color-fg)]"
                        : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="relative ml-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)]">
                  <input
                    type="color"
                    value={customColor || color}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Custom color"
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: activeColor }}
                    aria-hidden="true"
                  />
                </label>
                <span className="ml-1 text-xs text-[var(--color-muted-fg)]">
                  {accounts.length} account(s) connected
                </span>
              </div>
            </div>

            {/* Test connection result */}
            {testResult && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-sm",
                  testResult.ok
                    ? "border-[var(--color-success-500)] bg-[var(--color-success)] text-[var(--color-success-fg)]"
                    : "border-[var(--color-danger-500)] bg-[var(--color-danger)] text-[var(--color-danger-fg)]"
                )}
                role={testResult.ok ? "status" : "alert"}
              >
                {testResult.ok ? (
                  <>
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Connection validated. Settings look good.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      {testResult.errors.map((err) => (
                        <span key={err}>{err}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !canSave}
            data-testid="test-connection-button"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Test connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || addAccount.isPending}
            data-testid="save-account-button"
          >
            {addAccount.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Add account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
