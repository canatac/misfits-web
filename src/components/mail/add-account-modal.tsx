"use client";

/**
 * Add-account modal: choose an external provider or enter custom IMAP/SMTP
 * settings.
 */
import * as React from "react";
import { OAuth2ProviderPicker } from "@/components/mail/add-account-modal/oauth2-provider-picker";
import { ServerSettingsFields } from "@/components/mail/add-account-modal/server-settings-fields";
import { AccountColorPicker } from "@/components/mail/add-account-modal/account-color-picker";
import { useAddAccountHandlers } from "@/components/mail/add-account-modal/use-add-account-handlers";

export interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type AccountMode = "oauth2" | "custom";

export function AddAccountModal({ open, onOpenChange, onCreated }: AddAccountModalProps) {
  const { reset, handleClose } = useAddAccountHandlers(open, onOpenChange, onCreated);
  const [mode, setMode] = React.useState<AccountMode>("oauth2");

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
          enabled={open}
          onSelect={() => {
            reset();
            handleClose(false);
          }}
        />
      )}

      {mode === "custom" && (
        <div className="grid gap-4">
          <ServerSettingsFields
            serverConfig={{
              imapHost: "",
              imapPort: 993,
              imapTls: true,
              smtpHost: "",
              smtpPort: 465,
              smtpTls: true,
            }}
            setServerConfig={() => {}}
          />
          <AccountColorPicker accountsCount={0} onSelectColor={() => {}} />
        </div>
      )}
    </div>
  );
}
