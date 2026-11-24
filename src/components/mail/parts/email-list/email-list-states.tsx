"use client";

import {
  Inbox as InboxIcon,
  Search,
  PenSquare,
  RefreshCw,
  CloudOff,
} from "lucide-react";
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

/**
 * Which empty state the unified inbox shows.
 * - "syncing": the first sync of a freshly connected account is still running.
 * - "empty": the sync finished and found no message.
 * - "error": the connection or sync of the account failed.
 */
export type EmailListEmptyState = "empty" | "syncing" | "error";

export function EmailListEmpty({
  state = "empty",
}: {
  state?: EmailListEmptyState;
}) {
  if (state === "syncing") {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Synchronisation en cours…"
        description="Nous récupérons vos emails pour la première fois. Cela peut prendre quelques instants."
        size="lg"
        role="status"
        aria-live="polite"
        data-testid="email-list-empty-syncing"
      />
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        icon={CloudOff}
        title="Connexion au compte impossible"
        description="La synchronisation a échoué. Vérifiez la connexion de votre compte puis réessayez."
        size="lg"
        data-testid="email-list-empty-connection-failed"
      />
    );
  }

  return (
    <EmptyState
      icon={InboxIcon}
      title="Aucun email ici"
      description="Ce dossier est vide, ou aucun email ne correspond à vos filtres actuels."
      size="lg"
      data-testid="email-list-empty-no-mail"
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
