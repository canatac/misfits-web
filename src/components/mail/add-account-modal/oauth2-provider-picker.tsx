"use client";

/**
 * Provider picker for the "Connect an external account" flow.
 *
 * Presentational only: the catalogue state is owned by the caller (the
 * add-account modal) and passed down as props, so this component does not
 * import the data hook and no circular dependency remains.
 *
 * States (issue #1104, #1183):
 *  - loading: the provider catalogue is being fetched;
 *  - empty: the catalogue answered with no provider;
 *  - error: the catalogue request failed, with a retry action;
 *  - ready: the providers of the catalogue.
 */
import * as React from "react";

export interface OAuth2ProviderOption {
  value: string;
  label: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  scopes?: string[];
}

export interface OAuth2ProviderPickerProps {
  /** Catalogue options, or null while the request has not answered. */
  options: OAuth2ProviderOption[] | null;
  /** Whether the catalogue request runs. */
  loading: boolean;
  /** Error message of a failed catalogue request. */
  error: string | null;
  /** Currently selected provider key. */
  selected: string | null;
  /** Called with the chosen provider key. */
  onSelect: (provider: string) => void;
  /** Retry action of the error state. */
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
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="oauth2-provider-loading"
      >
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"
          aria-hidden="true"
        />
        Loading the available providers…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col gap-2 px-3 py-2 text-sm"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="oauth2-provider-error"
      >
        <p className="text-destructive">{error}</p>
        <button
          type="button"
          className="self-start rounded-md border border-border px-2 py-1 text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={onRetry}
          aria-label="Retry loading the provider catalogue"
        >
          Retry
        </button>
      </div>
    );
  }

  if (options && options.length === 0) {
    return (
      <p
        className="px-3 py-2 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="oauth2-provider-empty"
      >
        No external account provider is available.
      </p>
    );
  }

  if (!options) {
    return null;
  }

  return (
    <ul
      className="flex flex-col gap-1"
      data-testid="oauth2-provider-list"
      aria-label="External account providers"
    >
      {options.map((option) => (
        <li key={option.value}>
          <button
            type="button"
            aria-pressed={selected === option.value}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  );
}