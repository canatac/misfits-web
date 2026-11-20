"use client";

import React, { useState } from "react";
import { HelpButton, KeyboardShortcutsHelp } from "@/components/mail/keyboard-shortcuts-help";

/**
 * ComposerToolbar — actions attached to the composer header.
 * The help button opens the keyboard shortcut cheat sheet (MW-2026-122).
 */
export function ComposerToolbar({ onSend }: { onSend?: () => void }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {onSend && (
        <button
          onClick={onSend}
          className="px-3 py-1.5 rounded-lg bg-[#C49B66] text-[#121214] text-sm font-semibold hover:bg-[#D9B483] transition-colors"
          aria-label="Envoyer"
          data-testid="composer-send"
        >
          Envoyer
        </button>
      )}
      <HelpButton onClick={() => setHelpOpen(true)} />
      <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default ComposerToolbar;
