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

export function AddAccountModal({ open, onOpenChange, onCreated }: AddAccountModalProps) {
  const {
    mode,
    setMode,
    provider,
    setProvider,
    color,
    setColor,
    email,
    setEmail,
    submitting,
    error,
    handleSubmit,
  } = useAddAccountHandlers(open, onOpenChange, onCreated);

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
          onSelect={async (value: string) => {
            setProvider(value);
          }}
        />
      )}

      <AccountColorPicker value={color} onChange={setColor} />

      <ServerSettingsFields
        email={email}
        onEmailChange={setEmail}
        provider={provider}
      />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmit}
        className="rounded-[var(--radius-md)] bg-[var(--color-brand-500)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Add account"}
      </button>
    </div>
  );
}
