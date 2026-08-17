"use client";

import {
  Search as SearchIcon,
  X,
  Clock,
  Bookmark,
  Save,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OperatorMeta } from "@/types/search";
import type { SavedSearch, SearchHistory } from "@/types/search";

export { ResultsList } from "./results-list";

export function OperatorHints({
  operators,
  onInsert,
}: {
  operators: OperatorMeta[];
  onInsert: (op: OperatorMeta) => void;
}) {
  return (
    <div className="border-b border-[#242427] bg-[#121214]/80 p-2">
      <div className="mb-1 px-1 text-xs font-semibold tracking-wide text-[#A1A1AA] uppercase">
        Opérateurs intelligents
      </div>
      <div className="flex flex-wrap gap-1">
        {operators.map((op) => (
          <button
            key={op.operator}
            onMouseDown={(e) => {
              e.preventDefault();
              onInsert(op);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#242427] bg-[#0A0A0B] px-2.5 py-1 text-xs text-[#D4D4D8] transition-colors hover:border-[#C49B66]/40 hover:bg-[#1D1D20]"
          >
            <span className="font-mono font-medium text-[var(--color-brand-500)]">
              {op.label}
            </span>
            <span className="text-[var(--color-muted-fg)]">
              {op.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecentSearches({
  history,
  onPick,
}: {
  history: SearchHistory[];
  onPick: (q: string) => void;
}) {
  return (
    <div className="p-2">
      <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
        Récentes
      </div>
      {history.slice(0, 8).map((entry) => (
        <button
          key={entry.id}
          onClick={() => onPick(entry.query)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-muted)]"
        >
          <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
          <span className="flex-1 truncate">{entry.query}</span>
        </button>
      ))}
    </div>
  );
}

export function SavedSearches({
  saved,
  onApply,
  onDelete,
}: {
  saved: SavedSearch[];
  onApply: (s: SavedSearch) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-2">
      <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-[var(--color-muted-fg)] uppercase">
        Sauvegardées
      </div>
      {saved.map((s) => (
        <div
          key={s.id}
          className="group flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors hover:bg-[var(--color-muted)]"
        >
          <button
            onClick={() => onApply(s)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <Bookmark className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{s.name}</span>
              <span className="truncate text-xs text-[var(--color-muted-fg)]">
                {s.query}
              </span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-fg)]" />
          </button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onDelete(s.id)}
            aria-label={`Delete saved search: ${s.name}`}
          >
            <X className="h-3 w-3 text-[var(--color-danger-500)]" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function EmptyResult({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <SearchIcon className="h-10 w-10 text-[var(--color-muted-fg)]" />
      <div>
        <p className="text-sm font-medium text-[var(--color-fg)]">
          Aucun résultat
        </p>
        <p className="text-xs text-[var(--color-muted-fg)]">
          No emails match &ldquo;{query}&rdquo;. Try different keywords or
          operators.
        </p>
      </div>
    </div>
  );
}

export function InitialState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <SearchIcon className="h-10 w-10 text-[var(--color-muted-fg)]" />
      <div>
        <p className="text-sm font-medium text-[var(--color-fg)]">
          Rechercher dans votre mail
        </p>
        <p className="text-xs text-[var(--color-muted-fg)]">
          Use operators like <span className="font-mono">from:</span>,{" "}
          <span className="font-mono">subject:</span>,{" "}
          <span className="font-mono">is:unread</span>,{" "}
          <span className="font-mono">has:attachment</span>
        </p>
      </div>
    </div>
  );
}

export function ResultsFooter({
  count,
  onSave,
}: {
  count: number;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-[#242427] bg-[#121214] px-3 py-2 text-xs text-[#A1A1AA]">
      <span>
        {count} {count === 1 ? "résultat" : "résultats"}
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 gap-1 border border-[#242427] bg-[#1D1D20] text-[#E0E0E0] hover:border-[#C49B66]/50"
          onClick={onSave}
        >
          <Save className="h-3 w-3 text-[#C49B66]" />
          Sauvegarder la recherche
        </Button>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-[#242427] bg-[#1D1D20] px-1">
            ↑↓
          </kbd>
          naviguer
          <kbd className="rounded border border-[#242427] bg-[#1D1D20] px-1">
            ↵
          </kbd>
          ouvrir
        </span>
      </div>
    </div>
  );
}
