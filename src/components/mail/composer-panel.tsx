"use client";

/**
 * Composer panel — full composer UI combining recipient inputs, subject,
 * Tiptap editor, attachments and signature, with an action bar (Send,
 * Send later, Save draft, Discard, Full screen, Compact), undo-send banner,
 * attachment-mention warning, external-recipient warning, Cmd/Ctrl+Enter to
 * send, and loading/error states.
 *
 * Can render in two variants:
 *  - "panel" (default): bordered card, used inside the mail-page modal.
 *  - "page": full-height, used by the /compose route.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Clock,
  Save,
  Trash2,
  Maximize2,
  Minimize2,
  PanelTop,
  PanelBottom,
  Paperclip,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecipientInput } from "@/components/mail/recipient-input";
import { TiptapEditor } from "@/components/mail/tiptap-editor";
import { AttachmentZone } from "@/components/mail/attachment-zone";
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
import { getActiveSignature } from "@/lib/signatures";
import { useAuthStore } from "@/stores/auth-store";
import type { ComposeDraft, Recipient, RecipientType } from "@/types/composer";
import { AIToolbarButton } from "@/components/mail/ai-toolbar-button";
import { AIComposerPanel } from "@/components/mail/ai-composer-panel";
import { AISubjectSuggester } from "@/components/mail/ai-subject-suggester";
import { useAIStore } from "@/stores/ai-store";
import type { Editor } from "@tiptap/react";

interface ComposerPanelProps {
  variant?: "panel" | "page";
  onClose?: () => void;
  className?: string;
}

function buildDraft(s: ReturnType<typeof useComposerStore.getState>): ComposeDraft {
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

export function ComposerPanel({ variant = "panel", onClose, className }: ComposerPanelProps) {
  const router = useRouter();
  const store = useComposerStore();
  const {
    to,
    cc,
    bcc,
    subject,
    body,
    attachments,
    signature,
    isFullScreen,
    isCompact,
    isDirty,
    sendError,
    setRecipients,
    addRecipient,
    removeRecipient,
    setSubject,
    setBody,
    addAttachment,
    updateAttachment,
    removeAttachment,
    toggleFullScreen,
    toggleCompact,
    saveDraft,
    reset,
    startAutosave,
    stopAutosave,
  } = store;

  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sendLaterDate, setSendLaterDate] = useState<string>("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [undoBanner, setUndoBanner] = useState<{ id: string; seconds: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiEditor, setAiEditor] = useState<Editor | null>(null);
  const aiGenerating = useAIStore((s) => s.isGenerating);

  const sendMutation = useSendEmail();
  const saveMutation = useSaveDraft();
  const undoSend = useUndoSend(UNDO_SEND_DEFAULT);
  const isSending = sendMutation.isPending;

  // Initialise signature + autosave on mount.
  useEffect(() => {
    if (!signature) {
      const user = useAuthStore.getState().user;
      const email = user?.email ?? "hermes@misfits.ai";
      const name = user?.displayName ?? email.split("@")[0];
      store.setSignature(getActiveSignature(name, email));
    }
    startAutosave();
    return () => stopAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast on send error.
  useEffect(() => {
    if (sendError) toast.error(sendError);
  }, [sendError]);

  const hasExternal = useMemo(
    () =>
      [...to, ...cc, ...bcc].some((r) => validateRecipient(r.email).external),
    [to, cc, bcc],
  );

  const attachmentMention = useMemo(() => {
    const mentioned = checkAttachmentMention(body);
    const hasAttachment = attachments.length > 0;
    return mentioned && !hasAttachment;
  }, [body, attachments]);

  // Recipients that are invalid.
  const invalidRecipients = useMemo(
    () =>
      [...to, ...cc, ...bcc].filter((r) => !validateRecipient(r.email).valid),
    [to, cc, bcc],
  );

  const canSend = to.length > 0 && invalidRecipients.length === 0 && !isSending && subject.trim() !== "";

  const finalBody = useMemo(() => {
    if (!signature) return body;
    // Append signature if not already present.
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
        const id = payload.message_id ?? payload.messageId ?? payload.id ?? draft.id;
        const state = payload.deliveryState;
        if (options?.sendLater) {
          toast.success(`Email programme. ID: ${id}`);
          reset();
          if (onClose) onClose();
          else if (variant === "page") router.push("/mail");
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
          reset();
          if (onClose) onClose();
          else if (variant === "page") router.push("/mail");
        }
      } catch (err) {
        toast.error((err as Error).message || "Failed to send email.");
      }
    },
    [finalBody, invalidRecipients, to.length, sendMutation, onClose, reset, variant, router],
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

  // Cmd/Ctrl+Enter to send.
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

  // Cleanup undo timer on unmount.
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearInterval(undoTimer.current);
    };
  }, []);

  const onAdd = (type: RecipientType) => (r: Recipient) => addRecipient(type, r);
  const onRemove = (type: RecipientType) => (id: string) => removeRecipient(type, id);
  const onSet = (type: RecipientType) => (rs: Recipient[]) => setRecipients(type, rs);

  const showCcBccToggle = cc.length > 0 || bcc.length > 0 || showCcBcc;

  return (
    <div
      className={cn(
        "relative flex flex-col bg-[var(--color-card)] text-[var(--color-card-fg)]",
        variant === "page" ? "h-full" : "max-h-[85vh] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-xl)]",
        isFullScreen && "fixed inset-0 z-[var(--z-modal)] rounded-none border-0",
        className,
      )}
      data-testid="composer-panel"
    >
      {/* Header / action bar */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-3 py-2">
        <span className="text-sm font-medium text-[var(--color-muted-fg)]">
          {isDirty ? "Unsaved draft" : "Draft saved"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <AIToolbarButton
            active={showAIPanel}
            loading={aiGenerating}
            onClick={() => setShowAIPanel((v) => !v)}
          />

          {/* Send later */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Send later</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium">Schedule send</label>
                <input
                  type="datetime-local"
                  value={sendLaterDate}
                  onChange={(e) => setSendLaterDate(e.target.value)}
                  className="rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none"
                />
                <Button
                  size="sm"
                  disabled={!sendLaterDate || isSending}
                  onClick={() => {
                    handleSend({ sendLater: new Date(sendLaterDate).toISOString() });
                  }}
                >
                  Schedule
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleSaveDraft} className="gap-1.5">
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save draft</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleCompact} aria-label="Toggle compact">
                {isCompact ? <PanelTop className="h-4 w-4" /> : <PanelBottom className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isCompact ? "Expand" : "Compact"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleFullScreen} aria-label="Toggle full screen">
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullScreen ? "Exit full screen" : "Full screen"}</TooltipContent>
          </Tooltip>

          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close composer">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Undo-send banner */}
      {undoBanner && (
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-success-500)]/10 px-3 py-2 text-sm">
          <span className="text-[var(--color-fg)]">
            Email sent.{" "}
            <span className="font-medium text-[var(--color-success-500)]">
              Undo in {undoBanner.seconds}s
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndoSend}
            className="ml-auto"
          >
            Undo
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className={cn("flex flex-col gap-0", isCompact ? "p-2" : "p-4")}>
          {/* Recipients */}
          <RecipientInput
            type="to"
            label="To"
            recipients={to}
            onAdd={onAdd("to")}
            onRemove={onRemove("to")}
            autoFocus
          />
          {showCcBccToggle && (
            <>
              <Separator />
              <RecipientInput
                type="cc"
                label="Cc"
                recipients={cc}
                onAdd={onAdd("cc")}
                onRemove={onRemove("cc")}
              />
              <Separator />
              <RecipientInput
                type="bcc"
                label="Bcc"
                recipients={bcc}
                onAdd={onAdd("bcc")}
                onRemove={onRemove("bcc")}
              />
            </>
          )}
          {!showCcBcc && (
            <button
              type="button"
              onClick={() => setShowCcBcc(true)}
              className="self-end px-3 py-1 text-xs text-[var(--color-brand-500)] hover:underline"
            >
              + Cc / Bcc
            </button>
          )}

          <Separator />

          {/* Subject */}
          <div className="flex items-center gap-1">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0"
            />
            <AISubjectSuggester body={body} onApply={setSubject} />
          </div>

          <Separator />

          {/* Warnings */}
          {hasExternal && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 px-3 py-2 text-sm text-[var(--color-warning-500)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>This email will be sent to external recipients outside misfits.ai.</span>
            </div>
          )}
          {attachmentMention && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-500)]/30 bg-[var(--color-warning-500)]/10 px-3 py-2 text-sm text-[var(--color-warning-500)]">
              <Paperclip className="h-4 w-4 shrink-0" />
              <span>You mentioned an attachment but none is attached.</span>
            </div>
          )}
          {invalidRecipients.length > 0 && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-500)]/30 bg-[var(--color-danger-500)]/10 px-3 py-2 text-sm text-[var(--color-danger-500)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Some recipient addresses are invalid.</span>
            </div>
          )}

          {/* Editor */}
          <TiptapEditor
            value={body}
            onChange={setBody}
            isFullScreen={false}
            placeholder="Write your email… (Cmd/Ctrl+Enter to send)"
            onEditorReady={setAiEditor}
            onToggleAI={() => setShowAIPanel((v) => !v)}
            aiActive={showAIPanel}
            aiLoading={aiGenerating}
          />

          {/* Signature preview */}
          {signature && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-fg)]">
                Signature
              </div>
              <div
                className="prose-mail text-sm text-[var(--color-fg)]"
                // biome-ignore lint: signature HTML is generated internally
                dangerouslySetInnerHTML={{ __html: signature.html }}
              />
            </div>
          )}

          {/* Attachments */}
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-[var(--color-fg)]">
              <Paperclip className="h-4 w-4" />
              Attachments
            </div>
            <AttachmentZone
              attachments={attachments}
              onAdd={addAttachment}
              onUpdate={updateAttachment}
              onRemove={removeAttachment}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer / send bar */}
      <div className="flex items-center gap-2 border-t border-[var(--color-border)] px-3 py-2">
        <Button
          onClick={() => handleSend()}
          disabled={!canSend}
          className="gap-1.5"
        >
          {isSending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDiscard} className="gap-1.5 text-[var(--color-danger-500)]">
          <Trash2 className="h-4 w-4" />
          Discard
        </Button>
        <span className="ml-auto hidden text-xs text-[var(--color-muted-fg)] sm:inline">
          ⌘/Ctrl + Enter to send
        </span>
      </div>

      {/* AI composer panel */}
      <AIComposerPanel
        open={showAIPanel}
        editor={aiEditor}
        onClose={() => setShowAIPanel(false)}
      />
    </div>
  );
}
