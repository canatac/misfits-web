"use client";

import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComposerDraftIndicatorProps {
  lastSavedAt: string | null;
  isDirty: boolean;
  onDeleteDraft: () => void;
  className?: string;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 5000) return "just now";
  if (diffMs < 60000) return `${Math.floor(diffMs / 1000)}s ago`;
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ComposerDraftIndicator({ lastSavedAt, isDirty, onDeleteDraft, className }: ComposerDraftIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-[var(--color-muted-fg)]", className)} data-testid="draft-indicator">
      {lastSavedAt && !isDirty ? (
        <>
          <Check className="h-3 w-3 text-green-400" aria-hidden="true" />
          <span>Draft saved {formatTimestamp(lastSavedAt)}</span>
        </>
      ) : isDirty ? (
        <span>Unsaved changes</span>
      ) : null}
      {lastSavedAt && (
        <Button variant="ghost" size="icon" onClick={onDeleteDraft} aria-label="Delete draft" className="h-5 w-5">
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
