/**
 * useEmailActions — extracted from email-view (Sprint 13).
 * Groupe les 12 handlers d'action sur un email :
 *  - Reply / ReplyAll / Forward
 *  - ToggleStar / Archive / Delete / MarkUnread
 *  - Hermes: Summarize / ReplyDraft / Translate / Todos
 */
import { useCallback } from "react";
import type { Email, EmailAddress } from "@/types/email";
import type { Recipient } from "@/types/composer";
import { useEmailStore } from "@/stores/email-store";
import { useComposerStore, uid } from "@/stores/composer-store";
import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { toPlainText } from "@/components/mail/email-view-utils";

function toRecipient(
  address: string,
  name: string,
  type: Recipient["type"] = "to"
): Recipient {
  return {
    id: uid("rcpt"),
    email: address.toLowerCase(),
    name: name && name !== "me" ? name : undefined,
    type,
  };
}

function buildReplyBody(em: Email): string {
  const replyDate = new Date(em.date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `<p></p><blockquote>On ${replyDate}, ${em.from.name} &lt;${em.from.address}&gt; wrote:<br/>${em.body}</blockquote>`;
}

export function useEmailActions(email: Email | null | undefined) {
  const toggleStar = useEmailStore((s) => s.toggleStar);
  const markUnread = useEmailStore((s) => s.markUnread);
  const archive = useEmailStore((s) => s.archive);
  const deleteEmail = useEmailStore((s) => s.deleteEmail);
  const openComposer = useComposerStore((s) => s.openComposer);
  const sendChatMessage = useChatStore((s) => s.sendMessage);
  const openChatPanel = useChatStore((s) => s.setOpen);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const handleReply = useCallback(() => {
    if (!email) return;
    const replyTarget = email.replyTo ?? email.from;
    openComposer({
      to: [toRecipient(replyTarget.address, replyTarget.name)],
      subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
      body: buildReplyBody(email),
      inReplyTo: email.id,
      references: [...(email.references ?? []), email.id],
    });
  }, [email, openComposer]);

  const handleReplyAll = useCallback(() => {
    if (!email) return;
    const replyTarget = email.replyTo ?? email.from;
    const to: Recipient[] = [toRecipient(replyTarget.address, replyTarget.name)];
    const ccRecipients: Recipient[] = (email.cc ?? []).map((a: EmailAddress) =>
      toRecipient(a.address, a.name, "cc")
    );
    openComposer({
      to,
      cc: ccRecipients,
      subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
      body: buildReplyBody(email),
      inReplyTo: email.id,
      references: [...(email.references ?? []), email.id],
    });
  }, [email, openComposer]);

  const handleForward = useCallback(() => {
    if (!email) return;
    const fwdBody = `<p></p><blockquote>---------- Forwarded message ----------<br/>From: ${email.from.name} &lt;${email.from.address}&gt;<br/>Date: ${new Date(email.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}<br/>Subject: ${email.subject}<br/><br/>${email.body}</blockquote>`;
    openComposer({
      subject: email.subject.startsWith("Fwd:") ? email.subject : `Fwd: ${email.subject}`,
      body: fwdBody,
    });
  }, [email, openComposer]);

  const handleToggleStar = useCallback(() => {
    if (email) toggleStar(email.id);
  }, [email, toggleStar]);

  const handleArchive = useCallback(() => {
    if (email) archive(email.id);
  }, [email, archive]);

  const handleDelete = useCallback(() => {
    if (email) deleteEmail(email.id);
  }, [email, deleteEmail]);

  const handleMarkUnread = useCallback(() => {
    if (email) markUnread(email.id);
  }, [email, markUnread]);

  const askHermesAboutEmail = useCallback(
    (instruction: string) => {
      if (!email) return;
      const bodyPreview = toPlainText(email.body, email.bodyType).slice(0, 4000);
      const prompt = [
        instruction,
        "",
        `Sujet: ${email.subject}`,
        `De: ${email.from.name} <${email.from.address}>`,
        `Date: ${email.date}`,
        "",
        "Contenu:",
        bodyPreview,
      ].join("\n");
      openChatPanel(true);
      void sendChatMessage(prompt, {
        currentEmailId: email.id,
        currentFolder: email.folder,
        threadId: email.threadId,
        userId: userId ? String(userId) : undefined,
      });
    },
    [email, openChatPanel, sendChatMessage, userId]
  );

  const handleHermesSummarize = useCallback(
    () =>
      askHermesAboutEmail(
        "Résume cet email en 5 puces maximum (FR), puis donne niveau d'urgence (faible/moyen/élevé)."
      ),
    [askHermesAboutEmail]
  );
  const handleHermesReplyDraft = useCallback(
    () =>
      askHermesAboutEmail(
        "Propose 3 brouillons de réponse: (1) courte et polie, (2) détaillée et structurée, (3) directe et concise. Format Markdown."
      ),
    [askHermesAboutEmail]
  );
  const handleHermesTranslate = useCallback(
    () =>
      askHermesAboutEmail(
        "Traduis cet email en français clair en gardant le sens exact. Si déjà en français, fournis une version plus concise."
      ),
    [askHermesAboutEmail]
  );
  const handleHermesTodos = useCallback(
    () =>
      askHermesAboutEmail(
        "Extrais les TODO/action items: owner suggéré, échéance si détectée, et priorité."
      ),
    [askHermesAboutEmail]
  );

  return {
    handleReply,
    handleReplyAll,
    handleForward,
    handleToggleStar,
    handleArchive,
    handleDelete,
    handleMarkUnread,
    handleHermesSummarize,
    handleHermesReplyDraft,
    handleHermesTranslate,
    handleHermesTodos,
  };
}
