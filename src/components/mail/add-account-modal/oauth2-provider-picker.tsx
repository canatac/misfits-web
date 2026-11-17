"use client";

/**
 * Provider picker for the "Connect an external account" flow.
 *
 * States (issue #1104):
 *  - loading: the provider catalogue is being fetched;
 *  - empty: the catalogue answered with no provider;
 *  - error: the catalogue request failed, with a retry action;
 *  - ready: the providers of the catalogue.
 */
import * as React from "react";
import { useOAuth2Providers } from "@/hooks/use-oauth2-providers";

export interface OAuth2ProviderOption {
  value: string;
  label: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
}

export interface OAuth2ProviderPickerProps {
  /** Whether the catalogue request runs. */
  enabled?: boolean;
  /** Called with the chosen provider key. */
  onSelect: (provider: string) => void;
}

export function OAuth2ProviderPicker({
  enabled = true,
  onSelect,
}: OAuth2ProviderPickerProps) {
  const { options, loading, error, reload } = useOAuth2Providers(enabled);

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
        role="status"
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
        data-testid="oauth2-provider-error"
      >
        <p className="text-destructive">{error}</p>
        <button
          type="button"
          className="self-start rounded-md border border-border px-2 py-1 text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={reload}
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
