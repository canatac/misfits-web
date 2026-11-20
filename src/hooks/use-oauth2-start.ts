"use client";

/**
 * Start the OAuth2 consent flow for a provider.
 *
 * The navigation to the provider consent screen is immediate: it is
 * initiated on selection, before the start route answers (AC2). The start
 * route is only a fallback for providers without a built-in authorization
 * endpoint, and its error is surfaced after the navigation attempt.
 */
import * as React from "react";

/** Built-in authorization endpoints, mirroring the backend catalogue
 * (reimagined-guide src/external_imap/oauth2.rs, provider_config). */
const BUILTIN_AUTHORIZATION_ENDPOINTS: Record<string, string> = {
  gmail: "https://accounts.google.com/o/oauth2/v2/auth",
  google: "https://accounts.google.com/o/oauth2/v2/auth",
  outlook: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  microsoft: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  office365: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  yahoo: "https://api.login.yahoo.com/oauth2/request_auth",
};

export interface UseOAuth2StartResult {
  start: (provider: string) => Promise<void>;
  pending: boolean;
  error: string | null;
}

export function useOAuth2Start(): UseOAuth2StartResult {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function start(provider: string) {
    setPending(true);
    setError(null);

    // 1. Navigate immediately, without waiting for the start route (AC2).
    //    The provider consent screen is a full-page navigation.
    const builtin = BUILTIN_AUTHORIZATION_ENDPOINTS[provider.toLowerCase()];
    if (builtin) {
      const params = new URLSearchParams({
        provider,
        redirect_uri: window.location.origin + "/settings/accounts/oauth2/callback",
      });
      window.location.assign(`${builtin}?${params.toString()}`);
      // Keep pending true: the page is navigating away.
      return;
    }

    // 2. Fallback: ask the backend for the authorization URL.
    try {
      const response = await fetch(
        `/api/external-accounts/oauth2/start?provider=${encodeURIComponent(provider)}`,
        { headers: { Accept: "application/json" } }
      );
      const payload = (await response.json().catch(() => null)) as {
        authorizationUrl?: string;
        message?: string;
      } | null;
      if (!response.ok || !payload?.authorizationUrl) {
        throw new Error(
          payload?.message ??
            `The provider consent screen could not be opened (HTTP ${response.status}).`
        );
      }
      window.location.assign(payload.authorizationUrl);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The provider consent screen could not be opened."
      );
      setPending(false);
    }
  }

  return { start, pending, error };
}
