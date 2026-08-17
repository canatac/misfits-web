"use client";
import { useEffect, useState } from "react";
import type { Email } from "@/types/email";
import { useEmailStore } from "@/stores/email-store";

/**
 * Hydrate an email's body on demand — list responses omit the body for speed.
 */
export function useEmailBodyHydration(email: Email | null) {
  const setEmails = useEmailStore.setState;
  const [, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!email || (email.body && email.body.length > 0)) return;
    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const { mailAuthHeaders } = await import("@/lib/mail-api");
        const res = await fetch(`/api/emails/${encodeURIComponent(email.id)}`, {
          headers: mailAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const full = (await res.json()) as Email;
        if (cancelled || !full?.body) return;
        setEmails((s) => ({
          emails: s.emails.map((e) =>
            e.id === email.id
              ? { ...e, body: full.body, bodyType: full.bodyType ?? e.bodyType }
              : e
          ),
        }));
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, setEmails]);
}
