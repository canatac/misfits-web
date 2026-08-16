"use client";

import { ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type InsertMode = "replace" | "append";

interface OutputPreviewProps {
  output: string;
  insertMode: InsertMode;
  setInsertMode: (m: InsertMode) => void;
  onInsert: () => void;
  disabled?: boolean;
}

export function OutputPreview({
  output,
  insertMode,
  setInsertMode,
  onInsert,
  disabled,
}: OutputPreviewProps) {
  if (!output) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--color-muted-fg)]">
          Aperçu
        </label>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={insertMode === "replace" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setInsertMode("replace")}
              >
                Remplacer
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remplacer tout le corps</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={insertMode === "append" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setInsertMode("append")}
              >
                Ajouter
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajouter à la fin</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div
        className="prose-mail max-h-60 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-2.5 text-sm text-[var(--color-fg)]"
        // biome-ignore lint: AI output is HTML generated for the composer
        dangerouslySetInnerHTML={{ __html: output }}
      />
      <Button
        size="sm"
        className="gap-1.5"
        onClick={onInsert}
        disabled={disabled}
      >
        <ClipboardPaste className="h-4 w-4" />
        Insérer ({insertMode === "replace" ? "remplacer" : "ajouter"})
      </Button>
    </div>
  );
}
