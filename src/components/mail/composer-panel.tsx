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
import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TiptapEditor } from "@/components/mail/tiptap-editor";
import { ComposerRecipients } from "./composer/composer-recipients";
import { AttachmentZone } from "@/components/mail/attachment-zone";
import { useComposerStore } from "@/stores/composer-store";
import { getActiveSignature } from "@/lib/signatures";
import { useAuthStore } from "@/stores/auth-store";
import type { Recipient, RecipientType } from "@/types/composer";
import { AIComposerPanel } from "@/components/mail/ai-composer-panel";
import { AISubjectSuggester } from "@/components/mail/ai-subject-suggester";
import { useAIStore } from "@/stores/ai-store";
import type { Editor } from "@tiptap/react";
import { ComposerToolbar } from "./composer/composer-toolbar";
import { ComposerFooter } from "./composer/composer-footer";
import { ComposerWarnings } from "./composer/composer-warnings";
import { useComposerSend } from "./hooks/useComposerSend";

interface ComposerPanelProps {
  variant?: "panel" | "page";
  onClose?: () => void;
  className?: string;
}

export function ComposerPanel({
  variant = "panel",
  onClose,
  className,
}: ComposerPanelProps) {
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
    startAutosave,
    stopAutosave,
  } = store;

  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sendLaterDate, setSendLaterDate] = useState<string>("");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiEditor, setAiEditor] = useState<Editor | null>(null);
  const aiGenerating = useAIStore((s) => s.isGenerating);

  const {
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
  } = useComposerSend({ variant, onClose });

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

  const onAdd = (type: RecipientType) => (r: Recipient) =>
    addRecipient(type, r);
  const onRemove = (type: RecipientType) => (id: string) =>
    removeRecipient(type, id);
  const onSet = (type: RecipientType) => (rs: Recipient[]) =>
    setRecipients(type, rs);



  return (
    <div
      className={cn(
        "relative flex flex-col bg-[#0A0A0B] text-[#E0E0E0]",
        variant === "page"
          ? "h-full"
          : "max-h-[85vh] rounded-[var(--radius-xl)] border border-[#242427] shadow-[var(--shadow-xl)]",
        isFullScreen &&
          "fixed inset-0 z-[var(--z-modal)] rounded-none border-0",
        className
      )}
      data-testid="composer-panel"
    >
      <ComposerToolbar
        isDirty={isDirty}
        isSending={isSending}
        isCompact={isCompact}
        isFullScreen={isFullScreen}
        showAIPanel={showAIPanel}
        aiGenerating={aiGenerating}
        sendLaterDate={sendLaterDate}
        onToggleAI={() => setShowAIPanel((v) => !v)}
        onSetSendLaterDate={setSendLaterDate}
        onSendLater={(iso) => handleSend({ sendLater: iso })}
        onSaveDraft={handleSaveDraft}
        onToggleCompact={toggleCompact}
        onToggleFullScreen={toggleFullScreen}
        onClose={onClose}
      />

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
          <ComposerRecipients
            to={to}
            cc={cc}
            bcc={bcc}
            showCcBcc={showCcBcc}
            onShowCcBcc={() => setShowCcBcc(true)}
            onAdd={onAdd}
            onRemove={onRemove}
          />

          <Separator />

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

          <ComposerWarnings
            hasExternal={hasExternal}
            attachmentMention={attachmentMention}
            invalidRecipients={invalidRecipients}
          />

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

          {signature && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3">
              <div className="mb-1 text-xs font-medium tracking-wide text-[var(--color-muted-fg)] uppercase">
                Signature
              </div>
              <div
                className="prose-mail text-sm text-[var(--color-fg)]"
                // biome-ignore lint: signature HTML is generated internally
                dangerouslySetInnerHTML={{ __html: signature.html }}
              />
            </div>
          )}

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

      <ComposerFooter
        isSending={isSending}
        canSend={canSend}
        onSend={() => handleSend()}
        onDiscard={handleDiscard}
      />

      <AIComposerPanel
        open={showAIPanel}
        editor={aiEditor}
        onClose={() => setShowAIPanel(false)}
      />
    </div>
  );
}
