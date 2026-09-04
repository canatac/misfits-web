"use client";
import { useEffect, useState } from "react";
import type { Email } from "@/types/email";
import { useEmailStore } from "@/stores/email-store";
import { normalizeEmailRecord } from "@/lib/email-normalization";

export function needsEmailDetailHydration(email: Email | null): boolean {
  if (!email) return false;
  if (!email.body || email.body.length === 0) return true;
  if (email.hasAttachments && (email.attachments?.length ?? 0) === 0) return true;
  return false;
}

/**
 * Hydrate an email's body on demand — list responses omit the body for speed.
 */
export function useEmailBodyHydration(email: Email | null) {
  const setEmails = useEmailStore.setState;
  const [, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!email || !needsEmailDetailHydration(email)) return;
    const emailId = email.id;
    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const { mailAuthHeaders } = await import("@/lib/mail-api");
        const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}`, {
          headers: mailAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const full = normalizeEmailRecord((await res.json()) as Email);
        if (cancelled) return;
        setEmails((s) => ({
          emails: s.emails.map((e) =>
            e.id === emailId
              ? {
                  ...e,
                  subject: full.subject,
                  body: full.body || e.body,
                  bodyType: full.bodyType ?? e.bodyType,
                  attachments: full.attachments ?? e.attachments,
                  hasAttachments:
                    full.hasAttachments || (full.attachments?.length ?? 0) > 0,
                }
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
