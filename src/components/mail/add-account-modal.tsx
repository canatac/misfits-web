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
import { ImapConsole } from "@/components/mail/imap-console";
import type { AccountProvider, AccountServerConfig } from "@/types/account";
import {
  AccountColorPicker,
  TestResultBanner,
} from "./add-account-modal/account-color-picker";
import { ServerSettingsFields } from "./add-account-modal/server-settings-fields";

/** Accent color presets for accounts. */
import {
  ACCOUNT_COLORS,
  PROVIDER_PRESETS,
  validateConnection,
  type ValidationResult,
} from "@/lib/account-presets";

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

  const [probeInput, setProbeInput] = React.useState<null | {
    host: string;
    port: number;
    tls: boolean;
    username: string;
    password: string;
  }>(null);

  function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    // 1) Local syntactic validation stays as a first-line filter.
    const result = validateConnection(email, password, serverConfig);
    if (!result.ok) {
      setTestResult(result);
      setTesting(false);
      return;
    }
    // 2) Kick off the live IMAP probe so the user can see every command/response.
    setProbeInput({
      host: serverConfig.imapHost,
      port: serverConfig.imapPort,
      tls: serverConfig.imapSecurity !== "none",
      username: email,
      password,
    });
    // The console component reports completion via onDone.
  }

  async function handleSave() {
    // 1) Local syntactic validation.
    const result = validateConnection(email, password, serverConfig);
    if (!result.ok) {
      setTestResult(result);
      return;
    }

    const effectiveServerConfig: AccountServerConfig = needsServerFields
      ? serverConfig
      : (PROVIDER_PRESETS[provider].serverConfig ?? serverConfig);

    // 2) Push to backend: create + test + initial sync (today only).
    //    Any backend failure surfaces in the modal — nothing is stored locally
    //    if the account isn't actually reachable server-side.
    let backendId: string | undefined;
    try {
      setTesting(true);
      const {
        createExternalAccount,
        testExternalAccount,
        startExternalAccountSync,
        startOfTodayIso,
        toCreatePayload,
        deleteExternalAccount,
      } = await import("@/lib/external-accounts-api");

      const created = await createExternalAccount(
        toCreatePayload({
          email,
          provider,
          serverConfig: effectiveServerConfig,
          password,
        })
      );
      backendId = created.id;

      const test = await testExternalAccount(created.id);
      if (!test.ok) {
        // Clean up so the user isn't stuck with a dead account.
        try {
          await deleteExternalAccount(created.id);
        } catch {
          // noop
        }
        setTestResult({ ok: false, errors: [test.message || "IMAP test failed"] });
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
          // noop
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ ok: false, errors: [`Backend error: ${msg}`] });
      return;
    } finally {
      setTesting(false);
    }

    // 3) Only persist locally once backend setup succeeded.
    const account = await addAccount.mutateAsync({
      email,
      name: name.trim() || undefined,
      provider,
      color: activeColor,
      avatar: undefined,
      aliases: [],
      serverConfig: effectiveServerConfig,
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
              <ServerSettingsFields
                serverConfig={serverConfig}
                setServerConfig={setServerConfig}
              />
            )}

            {/* Color picker */}
            <AccountColorPicker
              color={color}
              customColor={customColor}
              onSelectColor={(c) => {
                setColor(c);
                setCustomColor("");
              }}
              onCustomColorChange={(c) => setCustomColor(c)}
              accountsCount={accounts.length}
            />

            {/* Live IMAP console (shows every request/response during test) */}
            <ImapConsole
              input={probeInput}
              onDone={(r) => {
                setTesting(false);
                setTestResult(
                  r.ok
                    ? { ok: true, errors: [] }
                    : { ok: false, errors: [r.error ?? "IMAP probe failed"] }
                );
              }}
              title="IMAP session"
            />

            {/* Test connection result */}
            <TestResultBanner testResult={testResult} />
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
