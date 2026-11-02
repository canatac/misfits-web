"use client";

import * as React from "react";

export type TwoFactorStatus = {
  enabled: boolean;
  qrCode?: string | null;
  secret?: string | null;
  recoveryCodes?: string[];
};

export type TwoFactorSetup = {
  qrCode: string;
  secret: string;
  recoveryCodes: string[];
};

/**
 * Frontend state for the 2FA settings section (MW-2026-142).
 * The backend contract is POST /api/auth/2fa/setup, POST /api/auth/2fa/activate
 * and POST /api/auth/2fa/disable; each returns { enabled, qrCode?, secret?, recoveryCodes? }.
 */
export function useTwoFactor() {
  const [status, setStatus] = React.useState<TwoFactorStatus | null>(null);
  const [setup, setSetup] = React.useState<TwoFactorSetup | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const request = React.useCallback(
    async (path: string, body?: unknown): Promise<TwoFactorStatus> => {
      const res = await fetch(path, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<TwoFactorStatus> & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      return {
        enabled: Boolean(data.enabled),
        qrCode: data.qrCode ?? null,
        secret: data.secret ?? null,
        recoveryCodes: data.recoveryCodes ?? [],
      };
    },
    []
  );

  React.useEffect(() => {
    let cancelled = false;
    request("/api/auth/2fa/setup")
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  async function setup2fa() {
    setBusy(true);
    setError(null);
    try {
      const s = await request("/api/auth/2fa/setup");
      setStatus(s);
      if (s.qrCode && s.secret) {
        setSetup({ qrCode: s.qrCode, secret: s.secret, recoveryCodes: s.recoveryCodes ?? [] });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function activate(code: string) {
    setBusy(true);
    setError(null);
    try {
      const s = await request("/api/auth/2fa/activate", { code });
      setStatus(s);
      setSetup(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    setError(null);
    try {
      const s = await request("/api/auth/2fa/disable");
      setStatus(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return { status, setup, busy, error, setup2fa, activate, deactivate };
}
