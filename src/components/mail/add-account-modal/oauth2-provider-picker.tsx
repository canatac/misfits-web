"use client";

/**
 * OAuth2 provider picker — fed by GET /api/external-accounts/oauth2/providers.
 *
 * Renders the provider options the backend catalogue returns (Gmail,
 * Outlook, Yahoo) plus a static "Other" option for providers without an
 * OAuth2 catalogue entry. The picker has a loading, an empty and an error
 * state; every option is a real <button>, so the list is reachable and
 * operable by keyboard (Enter and Space select).
 */
import * as React from "react";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OAuth2ProviderOption {
  value: string;
  label: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  scopes?: string[];
}

export interface OAuth2ProviderPickerProps {
  options: OAuth2ProviderOption[] | null;
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (provider: string) => void;
  onRetry?: () => void;
}

export function OAuth2ProviderPicker({
  options,
  loading,
  error,
  selected,
  onSelect,
  onRetry,
}: OAuth2ProviderPickerProps) {
  if (loading) {
    return (
      <div
        className="grid gap-2"
        role="status"
        aria-live="polite"
        data-testid="oauth2-provider-loading"
      >
        <span className="text-sm font-medium">Provider</span>
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm text-[var(--color-muted-fg)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading providers…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-2" data-testid="oauth2-provider-error">
        <span className="text-sm font-medium">Provider</span>
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger)] p-3 text-sm text-[var(--color-danger-fg)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="self-start rounded-[var(--radius-sm)] border border-current px-2 py-1 text-xs font-medium"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const providers = options ?? [];

  if (providers.length === 0) {
    return (
      <div className="grid gap-2" data-testid="oauth2-provider-empty">
        <span className="text-sm font-medium">Provider</span>
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm text-[var(--color-muted-fg)]">
          No OAuth2 provider is available from the server. Use custom IMAP/SMTP
          settings below, or check the server configuration.
        </p>
      </div>
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, value: string) {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      onSelect(value);
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium" id="oauth2-provider-label">
        Provider
      </span>
      <div
        role="radiogroup"
        aria-labelledby="oauth2-provider-label"
        className="grid grid-cols-2 gap-2"
        data-testid="oauth2-provider-options"
      >
        {providers.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(option.value)}
              onKeyDown={(event) => handleKeyDown(event, option.value)}
              className={cn(
                "flex items-center gap-2 rounded-[var(--radius-md)] border p-3 text-left text-sm transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-500)]",
                active
                  ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 text-[var(--color-fg)]"
                  : "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
              )}
              data-testid={`oauth2-provider-${option.value}`}
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
        {selected !== "other" && (
          <button
            type="button"
            role="radio"
            aria-checked={selected === "other"}
            onClick={() => onSelect("other")}
            onKeyDown={(event) => handleKeyDown(event, "other")}
            className={cn(
              "flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed p-3 text-left text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-500)]",
              selected === "other"
                ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 text-[var(--color-fg)]"
                : "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            )}
            data-testid="oauth2-provider-other"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            Other
          </button>
        )}
      </div>
    </div>
  );
}
