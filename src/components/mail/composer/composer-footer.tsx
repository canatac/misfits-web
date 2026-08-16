"use client";

import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComposerFooterProps {
  isSending: boolean;
  canSend: boolean;
  onSend: () => void;
  onDiscard: () => void;
}

export function ComposerFooter({
  isSending,
  canSend,
  onSend,
  onDiscard,
}: ComposerFooterProps) {
  return (
    <div className="flex items-center gap-2 border-t border-[#242427] bg-[#121214] px-3 py-2">
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
  );
}
