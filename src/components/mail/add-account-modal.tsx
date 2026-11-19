"use client";

/**
 * Add-account modal: choose an external provider or enter custom IMAP/SMTP
 * settings.
 *
 * The modal owns the OAuth2 catalogue hook and the consent start, and passes
 * the catalogue state down to the presentational provider picker.
 */
import * as React from "react";
import { Loader2 } from "lucide-react";
import { OAuth2ProviderPicker } from "@/components/mail/add-account-modal/oauth2-provider-picker";
import { ServerSettingsFields } from "@/components/mail/add-account-modal/server-settings-fields";
import { AccountColorPicker } from "@/components/mail/add-account-modal/account-color-picker";
import { useAddAccountHandlers } from "@/components/mail/add-account-modal/use-add-account-handlers";
import { useOAuth2Providers } from "@/hooks/use-oauth2-providers";
import { useOAuth2Start } from "@/hooks/use-oauth2-start";

export interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type AccountMode = "oauth2" | "custom";

export function AddAccountModal({ open, onOpenChange, onCreated }: AddAccountModalProps) {
  const { reset, handleClose } = useAddAccountHandlers({
    state: {
      provider: "gmail",
      email: "",
      name: "",
      password: "",
      serverConfig: {
        imapHost: "",
        imapPort: 993,
        imapSecurity: "ssl",
        smtpHost: "",
        smtpPort: 465,
        smtpSecurity: "ssl",
      },
      activeColor: "",
      needsServerFields: false,
    },
    dispatch: () => {},
    setProbeInput: () => {},
    addAccountMutate: (input) => {
      void input;
      return Promise.resolve({ id: "" });
    },
    setActiveAccount: () => {},
    onOpenChange,
  });

  const [mode, setMode] = React.useState<AccountMode>("oauth2");
  const [chosenProvider, setChosenProvider] = React.useState<string | null>(null);
  const oauth2 = useOAuth2Providers(open);
  const oauth2Start = useOAuth2Start();

  async function handleOauth2Select(value: string) {
    // "other" and providers without a catalogue entry keep the manual form.
    if (value === "other") {
      setMode("custom");
      return;
    }
    setChosenProvider(value);
    // Selecting a provider starts the consent flow: the modal closes and the
    // browser navigates to the provider consent screen.
    onOpenChange(false);
    await oauth2Start.start(value);
  }

  async function handleRestartConsent() {
    if (oauth2Start.error !== null) {
      setMode("oauth2");
    }
    onOpenChange(true);
    // AC5: restarting the connection calls the OAuth2 start again for the
    // chosen provider; it does not only reopen the modal.
    if (chosenProvider !== null) {
      await oauth2Start.start(chosenProvider);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <span className="text-sm font-medium" id="add-account-mode-label">
          Account type
        </span>
        <div
          role="radiogroup"
          aria-labelledby="add-account-mode-label"
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "oauth2"}
            onClick={() => setMode("oauth2")}
            className="rounded-[var(--radius-md)] border p-3 text-left text-sm"
          >
            External account
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "custom"}
            onClick={() => setMode("custom")}
            className="rounded-[var(--radius-md)] border p-3 text-left text-sm"
          >
            Custom IMAP/SMTP
          </button>
        </div>
      </div>

      {mode === "oauth2" && (
        <OAuth2ProviderPicker
          options={oauth2.options}
          loading={oauth2.loading}
          error={oauth2.error}
          selected={chosenProvider}
          onSelect={handleOauth2Select}
          onRetry={oauth2.reload}
        />
      )}

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
          className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger)] p-3 text-sm text-[var(--color-danger-fg)]"
          data-testid="oauth2-start-error"
        >
          <span>{oauth2Start.error}</span>
          <button
            type="button"
            onClick={handleRestartConsent}
            className="self-start rounded-[var(--radius-sm)] border border-current px-2 py-1 text-xs font-medium"
          >
            Restart the connection
          </button>
        </div>
      )}

      {mode === "custom" && (
        <div className="grid gap-4">
          <ServerSettingsFields
            serverConfig={{
              imapHost: "",
              imapPort: 993,
              imapSecurity: "ssl",
              smtpHost: "",
              smtpPort: 465,
              smtpSecurity: "ssl",
            }}
            setServerConfig={() => {}}
          />
          <AccountColorPicker
            color=""
            customColor=""
            onSelectColor={() => {}}
            onCustomColorChange={() => {}}
            accountsCount={0}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => handleClose(false)}
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onCreated?.();
            handleClose(false);
          }}
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
        >
          Add account
        </button>
      </div>
    </div>
  );
}
