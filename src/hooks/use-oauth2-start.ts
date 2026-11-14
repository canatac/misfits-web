"use client";

/**
 * Start the OAuth2 consent flow for a provider.
 *
 * Calls GET /api/external-accounts/oauth2/start?provider=... (proxied to the
 * backend) and navigates the browser to the returned authorization URL.
 */
import * as React from "react";

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
      // Navigate to the provider consent screen. This is a full-page
      // navigation: the modal closes and the provider answers on the
      // callback route.
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
