import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AIToolbarButton } from "@/components/mail/ai-toolbar-button";
import { relativeTime } from "@/stores/composer-store-helpers";
import type { SaveStatus } from "@/stores/composer-store-helpers";
import { KeyboardShortcutsHelp } from "@/components/mail/keyboard-shortcuts-help";

interface ComposerToolbarProps {
  isDirty: boolean;
  isSending: boolean;
  isCompact: boolean;
  isFullScreen: boolean;
  showAIPanel: boolean;
  aiGenerating: boolean;
  sendLaterDate: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  onToggleAI: () => void;
  onSetSendLaterDate: (date: string) => void;
  onSendLater: () => void;
  onSaveDraft: () => void;
  onToggleCompact: () => void;
  onToggleFullScreen: () => void;
  onClose?: () => void;
}

export function ComposerToolbar({
  isDirty,
  isSending,
  isCompact,
  isFullScreen,
  showAIPanel,
  aiGenerating,
  sendLaterDate,
  saveStatus,
  lastSavedAt,
  onToggleAI,
  onSetSendLaterDate,
  onSendLater,
  onSaveDraft,
  onToggleCompact,
  onToggleFullScreen,
  onClose,
}: ComposerToolbarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const saveIndicator = (() => {
    switch (saveStatus) {
      case "saving":
        return "Enregistrement...";
      case "saved":
        return lastSavedAt
          ? `Enregistré ${relativeTime(lastSavedAt)}`
          : "Brouillon enregistré";
      case "error":
        return "Erreur d'enregistrement";
      default:
        return null;
    }
  })();

  return (
    <div
      className={
        "flex items-center gap-1 border-b px-2 py-1" +
        (isFullScreen ? " hidden" : "")
      }
    >
      <div className="flex items-center gap-1">
        <AIToolbarButton
          showAIPanel={showAIPanel}
          aiGenerating={aiGenerating}
          onToggleAI={onToggleAI}
        />

        {saveIndicator && (
          <span className="text-xs text-muted-foreground">{saveIndicator}</span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCompact}
                aria-label="Mode compact"
              >
                <span aria-hidden="true">{isCompact ? "⤢" : "⤡"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isCompact ? "Agrandir" : "Réduire"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullScreen}
                aria-label="Plein écran"
              >
                <span aria-hidden="true">{isFullScreen ? "⤡" : "⤢"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Plein écran</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShortcuts(true)}
                aria-label="Keyboard shortcuts"
              >
                <KeyboardIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard shortcuts</TooltipContent>
          </Tooltip>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Fermer"
            >
              <span aria-hidden="true">✕</span>
            </Button>
          )}
        </div>

        <KeyboardShortcutsHelp
          open={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      </div>
    </div>
  );
}

function KeyboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
    </svg>
  );
}
