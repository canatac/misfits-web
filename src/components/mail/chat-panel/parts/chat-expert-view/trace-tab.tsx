"use client";

import { Badge } from "@/components/ui/badge";
import type { TraceEvent } from "./types";

interface Props {
  traceEvents: TraceEvent[];
  traceStats: { info: number; warn: number; error: number };
  onClearTrace: () => void;
}

export function TraceTab({ traceEvents, traceStats, onClearTrace }: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/35 p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">
          Statut run
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Badge variant="secondary">info {traceStats.info}</Badge>
          <Badge variant="warning">warn {traceStats.warn}</Badge>
          <Badge variant="destructive">error {traceStats.error}</Badge>
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-[var(--color-muted-fg)]">
            Événements
          </p>
          <button
            className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
            onClick={onClearTrace}
          >
            clear
          </button>
        </div>
        {traceEvents.length === 0 ? (
          <p className="text-xs text-[var(--color-muted-fg)]">
            Aucun événement pour le moment.
          </p>
        ) : (
          <div className="space-y-1">
            {traceEvents.slice(-80).map((e) => (
              <div key={e.id} className="text-xs">
                <span
                  className={
                    e.level === "error"
                      ? "text-red-500"
                      : e.level === "warn"
                        ? "text-amber-500"
                        : "text-[var(--color-muted-fg)]"
                  }
                >
                  [{new Date(e.at).toLocaleTimeString()}] {e.kind}
                </span>
                <span className="ml-2 text-[var(--color-fg)]">{e.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
