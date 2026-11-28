"use client";

/**
 * Start the OAuth2 consent flow for a provider.
 *
 * The backend start route is the single source of truth for the
 * authorization URL (issue #1119 AC2): selecting a provider calls
 * GET /api/external-accounts/oauth2/start?provider=... and navigates to the
 * returned authorizationUrl, for every provider, built-in or not. The
 * built-in authorization endpoints are a fallback, used only when the start
 * route does not answer or answers without an authorizationUrl.
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

    let startError: string | null = null;
    try {
      // 1. The start route is the single source of truth (AC2).
      const response = await fetch(
        `/api/external-accounts/oauth2/start?provider=${encodeURIComponent(provider)}`,
        { headers: { Accept: "application/json" } }
      );
      const payload = (await response.json().catch(() => null)) as {
        authorizationUrl?: string;
        message?: string;
      } | null;
      if (response.ok && payload?.authorizationUrl) {
        window.location.assign(payload.authorizationUrl);
        // Keep pending true: the page is navigating away.
        return;
      }
      startError =
        payload?.message ??
        `The provider consent screen could not be opened (HTTP ${response.status}).`;
    } catch (cause) {
      startError =
        cause instanceof Error
          ? cause.message
          : "The provider consent screen could not be opened.";
    }

    // 2. Fallback: a built-in authorization endpoint, when there is one.
    const builtin = BUILTIN_AUTHORIZATION_ENDPOINTS[provider.toLowerCase()];
    if (builtin) {
      const params = new URLSearchParams({
        provider,
        redirect_uri:
          window.location.origin + "/settings/accounts/oauth2/callback",
      });
      window.location.assign(`${builtin}?${params.toString()}`);
      // Keep pending true: the page is navigating away.
      return;
    }

    // 3. No built-in endpoint: surface the start route error.
    setError(startError ?? "The provider consent screen could not be opened.");
    setPending(false);
  }

  return { start, pending, error };
}
