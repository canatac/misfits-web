"use client";

import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OpsAction } from "./types";

interface Props {
  opsDryRun: boolean;
  onToggleOpsDryRun: () => void;
  onRunAdminAction: (action: string, prompt: string) => void;
  opsHistory: OpsAction[];
}

const ACTIONS: Array<{ label: string; action: string; prompt: string }> = [
  { label: "PR", action: "Créer PR", prompt: "Prépare une PR avec plan tests + rollback" },
  { label: "CI", action: "Lancer CI", prompt: "Prépare la relance CI et vérifications" },
  { label: "Deploy", action: "Deploy", prompt: "Prépare le déploiement prod + smoke tests" },
  { label: "Rollback", action: "Rollback", prompt: "Prépare le rollback + validations post rollback" },
];

export function OpsTab({ opsDryRun, onToggleOpsDryRun, onRunAdminAction, opsHistory }: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">Mode admin RBAC</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success-500)]" />
          <span>Utilisateur admin détecté</span>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={opsDryRun} onChange={onToggleOpsDryRun} />
          Dry-run (aucune exécution réelle)
        </label>
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">Actions sensibles</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ACTIONS.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant="outline"
              onClick={() => onRunAdminAction(a.action, a.prompt)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">Journal actions</p>
        {opsHistory.length === 0 ? (
          <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
            Aucune action admin lancée.
          </p>
        ) : (
          <div className="mt-2 space-y-1 text-xs">
            {opsHistory.map((entry, idx) => (
              <div key={`${entry.at}-${idx}`} className="flex items-center justify-between">
                <span>
                  {new Date(entry.at).toLocaleTimeString()} — {entry.action}
                </span>
                <Badge variant="outline">{entry.mode}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
