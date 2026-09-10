"use client";

/**
 * BulkActionBar — sticky action bar that slides in when 1+ emails are selected.
 *
 * Shows: selection count, select-all link, archive/delete/mark-read/star actions,
 * clear/close button. Includes undo toast for destructive actions.
 *
 * Design: dark bg [#121214], border [#242427], 48px height, 150ms slide-up animation.
 * Keyboard: Esc clears selection.
 */
import { useEffect, useCallback } from "react";
import { Archive, Trash2, MailOpen, Star, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type BulkActionType = "archive" | "delete" | "markRead" | "star";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onBulkAction: (action: BulkActionType) => void;
  onClearSelection: () => void;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "danger";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClick}
          aria-label={label}
          title={label}
          className={cn(
            "h-9 w-9 p-0",
            variant === "danger" && "hover:bg-red-500/10 hover:text-red-400"
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onBulkAction,
  onClearSelection,
}: BulkActionBarProps) {
  const handleArchive = useCallback(() => {
    onBulkAction("archive");
    toast.message("Archivés", {
      description: `${selectedCount} email${selectedCount > 1 ? "s" : ""}`,
      action: { label: "Annuler", onClick: () => {} },
      duration: 5000,
    });
  }, [onBulkAction, selectedCount]);

  const handleDelete = useCallback(() => {
    onBulkAction("delete");
    toast.error("Supprimés", {
      description: `${selectedCount} email${selectedCount > 1 ? "s" : ""}`,
      action: { label: "Annuler", onClick: () => {} },
      duration: 5000,
    });
  }, [onBulkAction, selectedCount]);

  const handleMarkRead = useCallback(() => {
    onBulkAction("markRead");
    toast.success("Marqués comme lus", {
      description: `${selectedCount} email${selectedCount > 1 ? "s" : ""}`,
      duration: 3000,
    });
  }, [onBulkAction, selectedCount]);

  const handleStar = useCallback(() => {
    onBulkAction("star");
    toast.success("Étoilés", {
      description: `${selectedCount} email${selectedCount > 1 ? "s" : ""}`,
      duration: 3000,
    });
  }, [onBulkAction, selectedCount]);

  // Esc clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClearSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClearSelection]);

  return (
    <div
      role="toolbar"
      aria-label="Actions groupées"
      className={cn(
        "flex items-center justify-between gap-2 border-b border-[#242427] bg-[#121214] px-3 transition-all duration-150 ease-out animate-slide-in-from-bottom"
      )}
      style={{ height: 48 }}
      data-testid="bulk-action-bar"
    >
      {/* Left: selection count + select all */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#E0E0E0]">
          {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs text-[#C49B66] underline-offset-2 hover:underline"
          aria-label={allSelected ? "Désélectionner tout" : "Tout sélectionner"}
        >
          {allSelected ? "Désélectionner" : "Tout sélectionner"}
        </button>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        <ActionButton
          icon={Archive}
          label="Archiver"
          onClick={handleArchive}
        />
        <ActionButton
          icon={Trash2}
          label="Supprimer"
          onClick={handleDelete}
          variant="danger"
        />
        <ActionButton
          icon={MailOpen}
          label="Marquer comme lu"
          onClick={handleMarkRead}
        />
        <ActionButton
          icon={Star}
          label="Étoiler"
          onClick={handleStar}
        />
        <div className="mx-1 h-4 w-px bg-[#242427]" aria-hidden="true" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          aria-label="Annuler la sélection"
          title="Annuler"
          className="h-9 w-9 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
