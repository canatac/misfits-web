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
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AccountProvider, AccountServerConfig, ProbeInput } from "@/lib/types";
import { ImapConsole } from "@/components/mail/imap-console";
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

export interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountModal({ open, onOpenChange }: AddAccountModalProps) {
  const [state, dispatch] = React.useReducer(formReducer, initialFormState);
  const { provider, email, name, password, serverConfig, activeColor, needsServerFields } =
    state;

  const [probeInput, setProbeInput] = React.useState<ProbeInput | null>(null);
  const [oauth2Provider, setOauth2Provider] = React.useState<string | null>(null);

  const activeColorValue = state.customColor || state.color;
  const needsServerFieldsValue = PROVIDER_PRESETS[provider].needsServerFields;

  const oauth2 = useOAuth2Providers(open);
  const oauth2Start = useOAuth2Start();

  const catalogueValues = React.useMemo(
    () => new Set((oauth2.options ?? []).map((option) => option.value)),
    [oauth2.options]
  );
  const oauth2Selected = oauth2Provider !== null && catalogueValues.has(oauth2Provider);

  const { reset, handleTestConnection, handleSave, handleClose } = useAddAccountHandlers({
    state: { provider, email, name, password, serverConfig, activeColor: activeColorValue, needsServerFields: needsServerFieldsValue },
    dispatch,
    reset,
  });

  const canSave =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0;

  async function handleOauth2Select(value: string) {
    setOauth2Provider(value);
    if (value === "other" || !catalogueValues.has(value)) {
      return;
    }
    // Selecting a provider starts the consent flow: the modal closes and the
    // browser navigates to the provider consent screen (AC2).
    onOpenChange(false);
    await oauth2Start.start(value);
  }

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>Add account</ModalTitle>
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

            {oauth2Start.pending && (
              <div
                className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm text-[var(--color-muted-fg)]"
                role="status"
                aria-live="polite"
                data-testid="oauth2-start-pending"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Opening the provider consent screen…
              </div>
            )}

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

                {needsServerFieldsValue && (
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
                  color={state.color}
                  customColor={state.customColor}
                  onSelectColor={(c) => dispatch({ type: "setColor", color: c })}
                  onCustomColorChange={(c) => dispatch({ type: "setCustomColor", customColor: c })}
                  accountsCount={0}
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

                <TestResultBanner testResult={state.testResult} />
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Add account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
