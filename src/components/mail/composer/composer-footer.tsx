"use client";

import { Clock, FileText, Paperclip, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import type { Attachment } from "@/types/composer";

interface ComposerFooterProps {
  isSending: boolean;
  canSend: boolean;
  attachments: Attachment[];
  isComposerEmpty: boolean;
  onJumpToAttachments: () => void;
  onSend: () => void;
  onSendLater: (iso: string) => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
}

export function ComposerFooter({
  isSending,
  canSend,
  attachments,
  isComposerEmpty,
  onJumpToAttachments,
  onSend,
  onSendLater,
  onSaveDraft,
  onDiscard,
}: ComposerFooterProps) {
  const [sendLaterDate, setSendLaterDate] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const uploadInProgress = attachments.some(
    (att) => att.status === "pending" || att.status === "uploading"
  );

  const handleSendLaterConfirm = () => {
    if (!sendLaterDate) return;
    const iso = new Date(sendLaterDate).toISOString();
    onSendLater(iso);
    setPopoverOpen(false);
    setSendLaterDate("");
    const formatted = new Date(sendLaterDate).toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    toast.success(`Envoyer prévu pour ${formatted}`);
  };

  return (
    <div className="border-t border-[#242427] bg-[#121214]">
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#242427] px-3 py-2">
          <Paperclip className="h-4 w-4 text-[#C49B66]" />
          <span className="text-sm text-[var(--color-fg)]">
            {attachments.length} pièce{attachments.length > 1 ? "s" : ""} jointe
            {attachments.length > 1 ? "s" : ""}
            {uploadInProgress ? " · upload en cours" : " · prête(s) à l'envoi"}
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveDraft}
              disabled={isComposerEmpty}
              aria-label="Sauvegarder le brouillon"
              className="gap-1.5 text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Brouillon</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sauvegarder le brouillon</TooltipContent>
        </Tooltip>

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isComposerEmpty}
                  aria-label="Envoyer plus tard"
                  className="gap-1.5 text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] disabled:opacity-50"
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Envoyer plus tard</span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Programmer l&apos;envoi</TooltipContent>
          </Tooltip>
          <PopoverContent align="start" className="w-72">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Programmer l&apos;envoi</label>
              <input
                type="datetime-local"
                value={sendLaterDate}
                onChange={(e) => setSendLaterDate(e.target.value)}
                className="rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none"
              />
              <Button
                size="sm"
                disabled={!sendLaterDate || isSending}
                onClick={handleSendLaterConfirm}
              >
                Confirmer
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <span className="ml-auto hidden text-xs text-[var(--color-muted-fg)] sm:inline">
          ⌘/Ctrl + Enter to send
        </span>
      </div>
    </div>
  );
}
