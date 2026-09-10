/**
 * useEmailActions — extracted from email-view (Sprint 13).
 * Groupe les 12 handlers d'action sur un email :
 *  - Reply / ReplyAll / Forward / ForwardAsAttachment
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
import { toPlainText } from "@/lib/mail-utils";
import { addToast } from "@/lib/ui/toast";

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

/** Build a minimal RFC 5322 raw email string for forwarding as attachment. */
function buildRawEmail(em: Email): string {
  const lines: string[] = [];
  lines.push(`From: ${em.from.name} <${em.from.address}>`);
  lines.push(`To: ${em.to.map((a) => `${a.name} <${a.address}>`).join(", ")}`);
  if (em.cc && em.cc.length > 0) {
    lines.push(`Cc: ${em.cc.map((a) => `${a.name} <${a.address}>`).join(", ")}`);
  }
  lines.push(`Subject: ${em.subject}`);
  lines.push(`Date: ${new Date(em.date).toUTCString().replace(/GMT/, "+0000")}`);
  lines.push(`Message-ID: ${em.messageId || `<${em.id}@misfits.ai>`}`);
  lines.push(`Content-Type: text/html; charset="utf-8"`);
  lines.push("");
  lines.push(em.body);
  return lines.join("\r\n");
}

/** Forward-as-attachment: open composer with the email as an .eml file. */
function makeEmlAttachment(em: Email) {
  const raw = buildRawEmail(em);
  const blob = new Blob([raw], { type: "message/rfc822" });
  const file = new File([blob], `${em.subject.replace(/[\\/\\?%*:|"<>]/g, "_")}.eml`, {
    type: "message/rfc822",
  });
  const attachment = {
    id: uid("att"),
    filename: file.name,
    contentType: "message/rfc822",
    size: blob.size,
    progress: 100,
    status: "done" as const,
    file,
  };
  return attachment;
}

export function useEmailActions(email: Email | null | undefined) {
  const toggleStar = useEmailStore((s) => s.toggleStar);
  const markUnread = useEmailStore((s) => s.markUnread);
  const archive = useEmailStore((s) => s.archive);
  const deleteEmail = useEmailStore((s) => s.deleteEmail);
  const undoArchive = useEmailStore((s) => s.undoArchive);
  const undoDelete = useEmailStore((s) => s.undoDelete);
  const openComposer = useComposerStore((s) => s.openComposer);
  const sendChatMessage = useChatStore((s) => s.sendMessage);
  const openChatPanel = useChatStore((s) => s.setOpen);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  // addToast is imported from @/lib/ui/toast (event bus), not from
  // toast-provider, to keep hooks decoupled from components (arch rule).

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

  /** Total recipients (sender + cc) that will receive a Reply All. */
  const replyAllRecipientCount = email ? 1 + (email.cc?.length ?? 0) : 0;

  const handleForward = useCallback(() => {
    if (!email) return;
    const fwdBody = `<p></p><blockquote>---------- Forwarded message ----------<br/>From: ${email.from.name} &lt;${email.from.address}&gt;<br/>Date: ${new Date(email.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}<br/>Subject: ${email.subject}<br/><br/>${email.body}</blockquote>`;
    openComposer({
      subject: email.subject.startsWith("Fwd:") ? email.subject : `Fwd: ${email.subject}`,
      body: fwdBody,
    });
  }, [email, openComposer]);

  /** Issue #433 — forward the current email as an .eml attachment. */
  const handleForwardAsAttachment = useCallback(() => {
    if (!email) return;
    const attachment = makeEmlAttachment(email);
    const fwdSubject = email.subject.startsWith("Fwd:")
      ? email.subject
      : `Fwd: ${email.subject}`;
    const fwdBody = `<p></p><p>---------- Forwarded message attached ----------<br/>From: ${email.from.name} &lt;${email.from.address}&gt;<br/>Date: ${new Date(email.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}<br/>Subject: ${email.subject}</p>`;
    openComposer({
      subject: fwdSubject,
      body: fwdBody,
      attachments: [attachment],
    });
  }, [email, openComposer]);

  const handleToggleStar = useCallback(() => {
    if (email) toggleStar(email.id);
  }, [email, toggleStar]);

  const handleArchive = useCallback(() => {
    if (!email) return;
    const originalFolder = email.folder;
    archive(email.id);
    addToast({
      type: "archive",
      message: "Email archivé",
      undo: () => undoArchive(email.id, originalFolder),
    });
  }, [email, archive, undoArchive]);

  const handleDelete = useCallback(() => {
    if (!email) return;
    deleteEmail(email.id);
    addToast({
      type: "delete",
      message: "Email supprimé",
      undo: () => undoDelete(email),
    });
  }, [email, deleteEmail, undoDelete]);

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
    replyAllRecipientCount,
    handleForward,
    handleForwardAsAttachment,
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
