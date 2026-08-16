"use client";

/**
 * Search Bar Dropdowns — history popover and operator autocomplete panel.
 * Extracted from search-bar.tsx to keep that file under the LOC guardrail.
 */
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { OperatorMeta } from "@/types/search";

interface HistoryEntry {
  id: string;
  query: string;
}

interface SearchHistoryPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchHistory: HistoryEntry[];
  onSelect: (query: string) => void;
  onClear: () => void;
  children: React.ReactNode;
}

export function SearchHistoryPopover({
  open,
  onOpenChange,
  searchHistory,
  onSelect,
  onClear,
  children,
}: SearchHistoryPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
          <span className="text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
            Recent Searches
          </span>
          {searchHistory.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={onClear}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {searchHistory.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onSelect(entry.query)}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <History className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
              <span className="flex-1 truncate">{entry.query}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface OperatorHintsPanelProps {
  operators: OperatorMeta[];
  onInsert: (op: OperatorMeta) => void;
}

export function OperatorHintsPanel({
  operators,
  onInsert,
}: OperatorHintsPanelProps) {
  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover)] shadow-[var(--shadow-lg)]">
      <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
        Search Operators
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {operators.map((op) => (
          <button
            key={op.operator}
            onMouseDown={(e) => {
              e.preventDefault();
              onInsert(op);
            }}
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-left transition-colors hover:bg-[var(--color-muted)]"
          >
            <span className="w-20 shrink-0 font-mono text-xs font-medium text-[var(--color-brand-500)]">
              {op.label}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm text-[var(--color-fg)]">
                {op.description}
              </span>
              <span className="text-xs text-[var(--color-muted-fg)]">
                {op.example}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
