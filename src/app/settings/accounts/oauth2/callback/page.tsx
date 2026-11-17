"use client";

/**
 * OAuth2 consent callback — returns the user to the app after the provider
 * consent screen.
 *
 * The provider redirects here with ?code=...&state=... on success or
 * ?error=access_denied (and similar) when the user refuses or the token is
 * revoked/expired. The code is exchanged by POST
 * /api/external-accounts/oauth2/callback; a revoked or expired token is
 * reported with a clear message and a way to reconnect.
 */
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type CallbackStatus =
  | { kind: "pending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<CallbackStatus>({ kind: "pending" });

  React.useEffect(() => {
    const code = searchParams.get("code");
    const providerError = searchParams.get("error");

    if (providerError) {
      setStatus({
        kind: "error",
        message:
          providerError === "access_denied"
            ? "Access was denied on the provider consent screen. Reconnect the account to try again."
            : `The provider returned an error (${providerError}). Reconnect the account to try again.`,
      });
      return;
    }

    if (!code) {
      setStatus({
        kind: "error",
        message:
          "The provider did not return an authorization code. Reconnect the account to try again.",
      });
      return;
    }

    let cancelled = false;
    fetch("/api/external-accounts/oauth2/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorizationCode: code,
        redirectUri: window.location.origin + window.location.pathname,
      }),
    })
      .then(async (response) => {
        if (cancelled) return;
        if (response.ok) {
          setStatus({ kind: "success" });
          window.setTimeout(() => router.push("/settings/accounts"), 1200);
          return;
        }
        const payload = (await response.json().catch(() => null)) as {
          code?: string;
          message?: string;
        } | null;
        setStatus({
          kind: "error",
          message:
            payload?.code === "OAUTH2_TOKEN_REVOKED"
              ? "The token was revoked or expired. Reconnect the account to authorise access again."
              : payload?.message ??
                `The authorization code could not be exchanged (HTTP ${response.status}). Reconnect the account to try again.`,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message:
            "The authorization code could not be exchanged. Reconnect the account to try again.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="grid w-full max-w-md gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-6">
        <h1 className="text-lg font-semibold">External account</h1>

        {status.kind === "pending" && (
          <div
            className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]"
            role="status"
            aria-live="polite"
            data-testid="oauth2-callback-pending"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Completing the provider authorization…
          </div>
        )}

        {status.kind === "success" && (
          <div
            className="text-sm text-[var(--color-success-fg)]"
            role="status"
            data-testid="oauth2-callback-success"
          >
            Account connected. Returning to your accounts…
          </div>
        )}

        {status.kind === "error" && (
          <div className="grid gap-3" data-testid="oauth2-callback-error">
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger)] p-3 text-sm text-[var(--color-danger-fg)]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{status.message}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/settings/accounts" className="inline-flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Reconnect the account
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
