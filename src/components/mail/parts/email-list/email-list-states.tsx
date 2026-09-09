"use client";

import { Inbox as InboxIcon, Search, PenSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function EmailListSkeleton() {
  return (
    <div className="flex flex-col gap-0" data-testid="email-list-skeleton">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 border-b border-[var(--color-border)] p-3"
        >
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmailListEmpty() {
  return (
    <EmptyState
      icon={InboxIcon}
      title="Aucun email ici"
      description="Ce dossier est vide, ou aucun email ne correspond à vos filtres actuels."
      size="lg"
      action={
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs text-[var(--color-muted-fg)]">
            Raccourcis clavier rapides :
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono text-[10px]">C</kbd>
              <span className="text-[var(--color-fg)]">Composer</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono text-[10px]">/</kbd>
              <span className="text-[var(--color-fg)]">Rechercher</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono text-[10px]">J/K</kbd>
              <span className="text-[var(--color-fg)]">Naviguer</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-muted)] font-mono text-[10px]">Ctrl + /</kbd>
              <span className="text-[var(--color-fg)]">Aide</span>
            </span>
          </div>
        </div>
      }
    />
  );
}
