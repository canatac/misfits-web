"use client";

import {
  Clock,
  Save,
  Maximize2,
  Minimize2,
  PanelTop,
  PanelBottom,
  X,
} from "lucide-react";
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
import { AIToolbarButton } from "@/components/mail/ai-toolbar-button";

interface ComposerToolbarProps {
  isDirty: boolean;
  isSending: boolean;
  isCompact: boolean;
  isFullScreen: boolean;
  showAIPanel: boolean;
  aiGenerating: boolean;
  sendLaterDate: string;
  onToggleAI: () => void;
  onSetSendLaterDate: (v: string) => void;
  onSendLater: (iso: string) => void;
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
  onToggleAI,
  onSetSendLaterDate,
  onSendLater,
  onSaveDraft,
  onToggleCompact,
  onToggleFullScreen,
  onClose,
}: ComposerToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-[#242427] bg-[#121214] px-3 py-2">
      <span className="text-sm font-medium text-[#A1A1AA]">
        {isDirty ? "Brouillon non sauvegardé" : "Brouillon sauvegardé"}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <AIToolbarButton
          active={showAIPanel}
          loading={aiGenerating}
          onClick={onToggleAI}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 border border-[#242427] bg-[#1D1D20] text-[#E0E0E0] hover:border-[#C49B66]/50 hover:bg-[#242427]"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Programmer</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Schedule send</label>
              <input
                type="datetime-local"
                value={sendLaterDate}
                onChange={(e) => onSetSendLaterDate(e.target.value)}
                className="rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none"
              />
              <Button
                size="sm"
                disabled={!sendLaterDate || isSending}
                onClick={() =>
                  onSendLater(new Date(sendLaterDate).toISOString())
                }
              >
                Schedule
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveDraft}
              className="gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save draft</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCompact}
              aria-label="Toggle compact"
            >
              {isCompact ? (
                <PanelTop className="h-4 w-4" />
              ) : (
                <PanelBottom className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isCompact ? "Expand" : "Compact"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFullScreen}
              aria-label="Toggle full screen"
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFullScreen ? "Exit full screen" : "Full screen"}
          </TooltipContent>
        </Tooltip>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close composer"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
