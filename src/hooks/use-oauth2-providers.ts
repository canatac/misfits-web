"use client";

/**
 * Fetch the OAuth2 provider catalogue from the backend.
 *
 * The client calls the Next.js proxy route (src/app/api/external-accounts/oauth2/providers/route.ts),
 * which forwards to the backend documented in reimagined-guide PR #738.
 */
import * as React from "react";
import type { OAuth2ProviderOption } from "@/components/mail/add-account-modal/oauth2-provider-picker";

export interface UseOAuth2ProvidersResult {
  options: OAuth2ProviderOption[] | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useOAuth2Providers(enabled: boolean): UseOAuth2ProvidersResult {
  const [options, setOptions] = React.useState<OAuth2ProviderOption[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/external-accounts/oauth2/providers", {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Provider catalogue request failed (HTTP ${response.status}).`);
        }
        const payload = (await response.json()) as {
          providers?: OAuth2ProviderOption[];
        };
        return payload.providers ?? [];
      })
      .then((providers) => {
        if (cancelled) return;
        setOptions(providers);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "The provider catalogue could not be loaded."
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  return {
    options,
    loading,
    error,
    reload: () => setAttempt((n) => n + 1),
  };
}
