"use client";

import { History, Trash2, Wand2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onRewrite: () => void;
  onTranslate: () => void;
  hasSelection: boolean;
  hasEditor: boolean;
  isGenerating: boolean;
  rewritePending: boolean;
  translatePending: boolean;
}

export function QuickActions({
  onRewrite,
  onTranslate,
  hasSelection,
  hasEditor,
  isGenerating,
  rewritePending,
  translatePending,
}: QuickActionsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[var(--color-muted-fg)]">
        Actions sur la sélection
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onRewrite}
          disabled={isGenerating || !hasSelection || !hasEditor}
          loading={rewritePending}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Réécrire
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onTranslate}
          disabled={isGenerating || !hasSelection || !hasEditor}
          loading={translatePending}
        >
          <Languages className="h-3.5 w-3.5" />
          Traduire
        </Button>
      </div>
      {!hasSelection && (
        <p className="text-xs text-[var(--color-muted-fg)]">
          {"Sélectionne du texte dans l'éditeur pour le réécrire ou le traduire."}
        </p>
      )}
    </div>
  );
}

interface PromptHistoryProps {
  prompts: string[];
  onPick: (p: string) => void;
  onClear: () => void;
}

export function PromptHistory({ prompts, onPick, onClear }: PromptHistoryProps) {
  if (prompts.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <History className="h-3.5 w-3.5 text-[var(--color-muted-fg)]" />
        <label className="text-xs font-medium text-[var(--color-muted-fg)]">
          Historique
        </label>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6"
          onClick={onClear}
          aria-label="Vider l'historique"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        {prompts.map((p, i) => (
          <button
            key={`${i}-${p.slice(0, 20)}`}
            type="button"
            onClick={() => onPick(p)}
            className="truncate rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
            title={p}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
