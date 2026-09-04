"use client";

import { Paperclip, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/types/composer";

interface ComposerFooterProps {
  isSending: boolean;
  canSend: boolean;
  attachments: Attachment[];
  onJumpToAttachments: () => void;
  onSend: () => void;
  onDiscard: () => void;
}

export function ComposerFooter({
  isSending,
  canSend,
  attachments,
  onJumpToAttachments,
  onSend,
  onDiscard,
}: ComposerFooterProps) {
  const uploadInProgress = attachments.some(
    (att) => att.status === "pending" || att.status === "uploading"
  );

  return (
    <div className="border-t border-[#242427] bg-[#121214]">
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#242427] px-3 py-2">
          <Paperclip className="h-4 w-4 text-[#C49B66]" />
          <span className="text-sm text-[var(--color-fg)]">
            {attachments.length} pièce{attachments.length > 1 ? "s" : ""} jointe
            {attachments.length > 1 ? "s" : ""}
            {uploadInProgress ? " · upload en cours" : " · prête(s) à l’envoi"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onJumpToAttachments}
            className="ml-auto text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
          >
            Voir
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2">
        <Button
          onClick={onSend}
          disabled={!canSend}
          className="gap-1.5 bg-[#C49B66] text-black hover:bg-[#B1844E]"
        >
          {isSending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Envoyer
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          className="gap-1.5 text-[var(--color-danger-500)]"
        >
          <Trash2 className="h-4 w-4" />
          Discard
        </Button>
        <span className="ml-auto hidden text-xs text-[var(--color-muted-fg)] sm:inline">
          ⌘/Ctrl + Enter to send
        </span>
      </div>
    </div>
  );
}
