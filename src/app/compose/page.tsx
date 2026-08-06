"use client";

/**
 * Compose page — full-page composer.
 *
 * Routed from the sidebar Compose button or the 'c' keyboard shortcut.
 * Supports ?reply=EMAIL_ID and ?forward=EMAIL_ID query params to pre-fill.
 */
import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppSwitcher } from "@/components/navigation/app-switcher";
import { ComposerPanel } from "@/components/mail/composer-panel";
import { useComposerStore, uid, type ComposerPrefill } from "@/stores/composer-store";
import { getMockEmailById } from "@/lib/mock-emails";
import type { Recipient } from "@/types/composer";
import type { Email } from "@/types/email";

function emailToRecipient(email: string, name?: string): Recipient {
  return {
    id: uid("rcpt"),
    email: email.toLowerCase(),
    name: name && name !== "me" ? name : undefined,
    type: "to",
  };
}

function buildReplyPrefill(email: Email): ComposerPrefill {
  const to: Recipient[] = [emailToRecipient(email.from.address, email.from.name)];
  const cc: Recipient[] = (email.cc ?? []).map((a) => emailToRecipient(a.address, a.name));
  // Include other "to" recipients for Reply All flavour if not the sender.
  for (const a of email.to) {
    if (a.address !== email.from.address && !to.some((r) => r.email === a.address.toLowerCase())) {
      to.push(emailToRecipient(a.address, a.name));
    }
  }
  const replyDate = new Date(email.date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const body = `<p></p><blockquote>On ${replyDate}, ${email.from.name} &lt;${email.from.address}&gt; wrote:<br/>${email.body}</blockquote>`;
  return {
    to,
    cc,
    subject: email.subject.startsWith("Re: ") ? email.subject : `Re: ${email.subject}`,
    body,
    inReplyTo: email.messageId,
    references: [...(email.references ?? []), email.messageId].filter(Boolean),
  };
}

function buildForwardPrefill(email: Email): ComposerPrefill {
  const fwdBody = `<p></p><blockquote>---------- Forwarded message ----------<br/>From: ${email.from.name} &lt;${email.from.address}&gt;<br/>Date: ${new Date(email.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}<br/>Subject: ${email.subject}<br/><br/>${email.body}</blockquote>`;
  return {
    to: [],
    subject: email.subject.startsWith("Fwd: ") ? email.subject : `Fwd: ${email.subject}`,
    body: fwdBody,
  };
}

function ComposePageContent() {
  const searchParams = useSearchParams();
  const openComposer = useComposerStore((s) => s.openComposer);
  const composerOpen = useComposerStore((s) => s.composerOpen);
  const prefill = useComposerStore((s) => s.prefill);

  const replyId = searchParams.get("reply");
  const forwardId = searchParams.get("forward");

  const computedPrefill = useMemo<ComposerPrefill | null>(() => {
    if (replyId) {
      const email = getMockEmailById(replyId);
      if (email) return buildReplyPrefill(email);
    }
    if (forwardId) {
      const email = getMockEmailById(forwardId);
      if (email) return buildForwardPrefill(email);
    }
    return null;
  }, [replyId, forwardId]);

  // Open the composer once on mount with the resolved pre-fill (if any).
  useEffect(() => {
    if (!composerOpen) {
      openComposer(computedPrefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7]" data-testid="compose-page">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <div className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-4xl flex-col p-4">
        <ComposerPanel variant="page" />
        {prefill && replyId && (
          <p className="mt-2 text-xs text-[var(--color-muted-fg)]">
            Replying to email {replyId}.
          </p>
        )}
        {prefill && forwardId && (
          <p className="mt-2 text-xs text-[var(--color-muted-fg)]">
            Forwarding email {forwardId}.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--color-muted-fg)]">Loading composer…</div>}>
      <ComposePageContent />
    </Suspense>
  );
}
