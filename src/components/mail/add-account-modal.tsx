"use client";

/**
 * Add Account Modal — choose a provider, enter IMAP/SMTP + credentials,
 * pick an accent color, test connection, and save.
 *
 * Providers with an OAuth2 catalogue entry (Gmail, Outlook, Yahoo) offer a
 * consent flow; "Other" and providers without an entry keep the manual
 * username/password form.
 */
import * as React from "react";
import { Check, Loader2, Mail } from "lucide-react";
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
import {
  OAuth2ProviderPicker,
  type OAuth2ProviderOption,
} from "./add-account-modal/oauth2-provider-picker";
import { PROVIDER_PRESETS } from "@/lib/account-presets";
import { useOAuth2Providers } from "@/hooks/use-oauth2-providers";
import { useOAuth2Start } from "@/hooks/use-oauth2-start";
import { formReducer, initialFormState } from "./parts/add-account-modal/form-reducer";
import { useAddAccountHandlers } from "./add-account-modal/use-add-account-handlers";

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProbeInput = {
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
};

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const { addAccount } = useAccountMutations();
  const accounts = useAccountStore((s) => s.accounts);
  const setActiveAccount = useAccountStore((s) => s.setActiveAccount);

  const [state, dispatch] = React.useReducer(formReducer, initialFormState);
  const {
    provider,
    email,
    name,
    password,
    color,
    customColor,
    serverConfig,
    testing,
    testResult,
  } = state;

  const [probeInput, setProbeInput] = React.useState<ProbeInput | null>(null);
  const [oauth2Provider, setOauth2Provider] = React.useState<string | null>(null);

  const activeColor = customColor || color;
  const needsServerFields = PROVIDER_PRESETS[provider].needsServerFields;

  const oauth2 = useOAuth2Providers(open);
  const oauth2Start = useOAuth2Start();

  const catalogueValues = React.useMemo(
    () => new Set((oauth2.options ?? []).map((option) => option.value)),
    [oauth2.options]
  );
  const oauth2Selected = oauth2Provider !== null && catalogueValues.has(oauth2Provider);

  const { reset, handleTestConnection, handleSave, handleClose } = useAddAccountHandlers({
    state: { provider, email, name, password, serverConfig, activeColor, needsServerFields },
    dispatch,
    setProbeInput,
    addAccountMutate: (input) => addAccount.mutateAsync(input),
    setActiveAccount,
    onOpenChange,
  });
  void reset;

  const canSave =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0;

  async function handleOauth2Select(value: string) {
    setOauth2Provider(value);
    if (value === "other" || !catalogueValues.has(value)) {
      return;
    }
    await oauth2Start.start(value);
  }

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
            <OAuth2ProviderPicker
              options={oauth2.options}
              loading={oauth2.loading}
              error={oauth2.error}
              selected={oauth2Provider}
              onSelect={handleOauth2Select}
              onRetry={oauth2.reload}
            />

            {oauth2Start.error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger)] p-3 text-sm text-[var(--color-danger-fg)]"
                data-testid="oauth2-start-error"
              >
                <span>{oauth2Start.error}</span>
              </div>
            )}

            {!oauth2Selected && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="account-provider">Provider</Label>
                  <Select
                    value={provider}
                    onValueChange={(v) =>
                      dispatch({ type: "setProvider", provider: v as AccountProvider })
                    }
                  >
                    <SelectTrigger id="account-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PROVIDER_PRESETS) as AccountProvider[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PROVIDER_PRESETS[p].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="account-email">Email address</Label>
                    <Input
                      id="account-email"
                      type="email"
                      value={email}
                      onChange={(e) => dispatch({ type: "setEmail", email: e.target.value })}
                      placeholder="you@example.com"
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="account-name">Display name (optional)</Label>
                    <Input
                      id="account-name"
                      value={name}
                      onChange={(e) => dispatch({ type: "setName", name: e.target.value })}
                      placeholder="Work, Personal…"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="account-password">Password / App password</Label>
                  <Input
                    id="account-password"
                    type="password"
                    value={password}
                    onChange={(e) => dispatch({ type: "setPassword", password: e.target.value })}
                    placeholder="••••••••••••"
                  />
                  <p className="text-xs text-[var(--color-muted-fg)]">
                    Use an app-specific password for providers that require 2FA.
                  </p>
                </div>

                {needsServerFields && (
                  <ServerSettingsFields
                    serverConfig={serverConfig}
                    setServerConfig={(update) =>
                      dispatch({
                        type: "setServerConfig",
                        serverConfig:
                          typeof update === "function"
                            ? (update as (s: AccountServerConfig) => AccountServerConfig)(serverConfig)
                            : update,
                      })
                    }
                  />
                )}

                <AccountColorPicker
                  color={color}
                  customColor={customColor}
                  onSelectColor={(c) => dispatch({ type: "setColor", color: c })}
                  onCustomColorChange={(c) => dispatch({ type: "setCustomColor", customColor: c })}
                  accountsCount={accounts.length}
                />

                <ImapConsole
                  input={probeInput}
                  onDone={(r) => {
                    dispatch({ type: "setTesting", testing: false });
                    dispatch({
                      type: "setTestResult",
                      testResult: r.ok
                        ? { ok: true, errors: [] }
                        : { ok: false, errors: [r.error ?? "IMAP probe failed"] },
                    });
                  }}
                  title="IMAP session"
                />

                <TestResultBanner testResult={testResult} />
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
          {!oauth2Selected && (
            <>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !canSave}
                data-testid="test-connection-button"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Test connection
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave || addAccount.isPending}
                data-testid="save-account-button"
              >
                {addAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Add account
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
