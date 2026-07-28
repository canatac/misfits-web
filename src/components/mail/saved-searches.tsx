"use client";

/**
 * Saved Searches panel — list of saved searches with click to execute,
 * delete, and save current search with a custom name.
 */
import { useState, useCallback } from "react";
import {
  Bookmark,
  Trash2,
  Search,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { useSearchStore } from "@/stores/search-store";
import type { SavedSearch } from "@/types/search";

interface SavedSearchesProps {
  className?: string;
}

export function SavedSearches({ className }: SavedSearchesProps) {
  const savedSearches = useSearchStore((s) => s.savedSearches);
  const query = useSearchStore((s) => s.query);
  const applySavedSearch = useSearchStore((s) => s.applySavedSearch);
  const deleteSavedSearch = useSearchStore((s) => s.deleteSavedSearch);
  const saveSearch = useSearchStore((s) => s.saveSearch);

  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState("");

  const handleSave = useCallback(() => {
    if (!query.trim()) return;
    if (!name.trim()) {
      setName("");
      setIsNaming(true);
      return;
    }
    saveSearch(name, query);
    setName("");
    setIsNaming(false);
  }, [query, name, saveSearch]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteSavedSearch(id);
    },
    [deleteSavedSearch],
  );

  const handleApply = useCallback(
    (saved: SavedSearch) => {
      applySavedSearch(saved);
    },
    [applySavedSearch],
  );

  const canSave = query.trim().length > 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-[var(--color-card)]",
        className,
      )}
      data-testid="saved-searches"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-[var(--color-muted-fg)]" />
          <span className="text-sm font-medium">Saved Searches</span>
        </div>
        {canSave && !isNaming && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1"
            onClick={() => setIsNaming(true)}
            aria-label="Save current search"
          >
            <Plus className="h-3.5 w-3.5" />
            Save
          </Button>
        )}
      </div>

      {/* Save current search form */}
      {isNaming && (
        <div className="flex items-center gap-1 border-b border-[var(--color-border)] p-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this search..."
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setIsNaming(false);
                setName("");
              }
            }}
          />
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsNaming(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Saved searches list */}
      <ScrollArea className="flex-1">
        {savedSearches.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved searches"
            description="Save frequently used searches for quick access later."
            size="sm"
          />
        ) : (
          <div className="flex flex-col gap-0.5 p-2">
            {savedSearches.map((saved) => (
              <div
                key={saved.id}
                className="group flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors hover:bg-[var(--color-muted)]"
              >
                <button
                  onClick={() => handleApply(saved)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
                  aria-label={`Execute saved search: ${saved.name}`}
                >
                  <span className="truncate text-sm font-medium text-[var(--color-fg)]">
                    {saved.name}
                  </span>
                  <span className="flex items-center gap-1 truncate text-xs text-[var(--color-muted-fg)]">
                    <Search className="h-3 w-3 shrink-0" />
                    <span className="truncate">{saved.query}</span>
                  </span>
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => handleDelete(saved.id)}
                  aria-label={`Delete saved search: ${saved.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger-500)]" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
