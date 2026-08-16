"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useComposerStore } from "@/stores/composer-store";
import {
  useSendEmail,
  useSaveDraft,
  useUndoSend,
  UNDO_SEND_DEFAULT,
} from "@/hooks/use-composer";
import {
  checkAttachmentMention,
  validateRecipient,
} from "@/lib/email-validation";
import type { ComposeDraft } from "@/types/composer";

function buildDraft(
  s: ReturnType<typeof useComposerStore.getState>
): ComposeDraft {
  return {
    id: s.draftId,
    to: s.to,
    cc: s.cc,
    bcc: s.bcc,
    subject: s.subject,
    body: s.body,
    attachments: s.attachments,
    signature: s.signature,
    createdAt: s.lastSavedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inReplyTo: s.inReplyTo,
    references: s.references,
  };
}

interface UseComposerSendOpts {
  variant: "panel" | "page";
  onClose?: () => void;
}

export function useComposerSend({ variant, onClose }: UseComposerSendOpts) {
  const router = useRouter();
  const { to, cc, bcc, subject, body, attachments, signature, sendError, reset, saveDraft } =
    useComposerStore();

  const sendMutation = useSendEmail();
  const saveMutation = useSaveDraft();
  const undoSend = useUndoSend(UNDO_SEND_DEFAULT);
  const isSending = sendMutation.isPending;

  const [undoBanner, setUndoBanner] = useState<{
    id: string;
    seconds: number;
  } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sendError) toast.error(sendError);
  }, [sendError]);

  const hasExternal = useMemo(
    () =>
      [...to, ...cc, ...bcc].some((r) => validateRecipient(r.email).external),
    [to, cc, bcc]
  );

  const attachmentMention = useMemo(() => {
    const mentioned = checkAttachmentMention(body);
    const hasAttachment = attachments.length > 0;
    return mentioned && !hasAttachment;
  }, [body, attachments]);

  const invalidRecipients = useMemo(
    () =>
      [...to, ...cc, ...bcc].filter((r) => !validateRecipient(r.email).valid),
    [to, cc, bcc]
  );

  const canSend =
    to.length > 0 &&
    invalidRecipients.length === 0 &&
    !isSending &&
    subject.trim() !== "";

  const finalBody = useMemo(() => {
    if (!signature) return body;
    if (body.includes(signature.html.slice(0, 40))) return body;
    return body + signature.html;
  }, [body, signature]);

  const handleSend = useCallback(
    async (options?: { sendLater?: string }) => {
      if (invalidRecipients.length > 0) {
        toast.error("Please fix invalid recipient addresses.");
        return;
      }
      if (to.length === 0) {
        toast.error("Add at least one recipient.");
        return;
      }
      const state = useComposerStore.getState();
      const draft = buildDraft({ ...state, body: finalBody });
      try {
        const result = await sendMutation.mutateAsync({ draft, options });
        const payload = result as {
          id?: string;
          message_id?: string;
          messageId?: string;
          deliveryState?: "queued" | "sending" | "sent" | "failed";
        };
        const id =
          payload.message_id ?? payload.messageId ?? payload.id ?? draft.id;
        const state = payload.deliveryState;
        if (options?.sendLater) {
          toast.success(`Email programme. ID: ${id}`);
        } else {
          const stateLabel =
            state === "sent"
              ? "sent"
              : state === "queued"
                ? "queued"
                : state === "sending"
                  ? "sending"
                  : "failed";
          toast.success(`Email ${stateLabel}. ID: ${id}`);
        }
        reset();
        if (onClose) onClose();
        else if (variant === "page") router.push("/mail");
      } catch (err) {
        toast.error((err as Error).message || "Failed to send email.");
      }
    },
    [
      finalBody,
      invalidRecipients,
      to.length,
      sendMutation,
      onClose,
      reset,
      variant,
      router,
    ]
  );

  const handleUndoSend = useCallback(() => {
    if (undoTimer.current) clearInterval(undoTimer.current);
    undoTimer.current = null;
    setUndoBanner(null);
    undoSend.undo();
    toast.success("Send cancelled — draft restored.");
  }, [undoSend]);

  const handleSaveDraft = useCallback(() => {
    const state = useComposerStore.getState();
    const draft = buildDraft(state);
    saveMutation.mutate(draft);
    saveDraft();
    toast.success("Draft saved.");
  }, [saveMutation, saveDraft]);

  const handleDiscard = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSend]);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearInterval(undoTimer.current);
    };
  }, []);

  return {
    isSending,
    canSend,
    hasExternal,
    attachmentMention,
    invalidRecipients,
    undoBanner,
    handleSend,
    handleUndoSend,
    handleSaveDraft,
    handleDiscard,
  };
}
