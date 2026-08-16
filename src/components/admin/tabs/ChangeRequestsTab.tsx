"use client";
// ChangeRequestsTab — orchestrateur pur.
//
// L'état, les mutations et les handlers viennent du parent
// (useAdminConsoleContext, passé via `ctx`). Ce composant se contente de :
// 1) exposer un hook façade qui découpe le contexte en groupes de props,
// 2) composer les sous-composants du dossier `change-requests/` et le
//    Kanban Board déjà extrait (PR #133).

import React from "react";
import { Badge } from "../shared";
import { ChangeRequestsKanbanBoard } from "./ChangeRequestsKanbanBoard";
import { ChangeRequestsMonitoring } from "./change-requests/ChangeRequestsMonitoring";
import { WorkflowRunsList } from "./change-requests/WorkflowRunsList";
import { WorkflowRunDetailPanel } from "./change-requests/WorkflowRunDetailPanel";
import { ChangeRequestCreateForm } from "./change-requests/ChangeRequestCreateForm";
import { DeleteChangeRequestDialog } from "./change-requests/DeleteChangeRequestDialog";
import { useChangeRequestsTabContext } from "./change-requests/useChangeRequestsTabContext";

// Le contexte est intentionnellement large (record open) pour permettre
// l'extraction incrémentale. Il sera resserré progressivement au fil des
// prochaines itérations en dérivant les vrais types depuis les hooks.
export interface ChangeRequestsTabContext {
  [key: string]: any;
}

export function ChangeRequestsTab(ctx: ChangeRequestsTabContext) {
  const {
    monitoringProps,
    runsListProps,
    runDetailProps,
    createFormProps,
    deleteDialogProps,
    kanbanProps,
    header,
    transitionNote,
  } = useChangeRequestsTabContext(ctx);

  return (
    <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#E4E4E7]">
            Change Requests
          </h2>
          <p className="mt-1 text-xs text-[#71717A]">
            Point d&apos;entrée unique des évolutions produit. Soumission →
            triage → plan → build → QA → release.
          </p>
        </div>
        <Badge tone={header.isFetching ? "warn" : "ok"}>
          {header.isFetching ? "syncing" : "workflow live"}
        </Badge>
      </div>

      <ChangeRequestsMonitoring {...monitoringProps} />

      <div className="mb-3 grid gap-3 xl:grid-cols-3">
        <WorkflowRunsList {...runsListProps} />
        <WorkflowRunDetailPanel {...runDetailProps} />
      </div>

      <ChangeRequestCreateForm {...createFormProps} />

      <div className="mt-3 rounded-xl border border-[#232327] bg-[#151518] p-3">
        <label className="text-xs text-[#A1A1AA]">
          Note de transition (optionnelle)
        </label>
        <input
          value={transitionNote.value}
          onChange={(e) => transitionNote.setValue(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
          placeholder="Ex: spec validée, passage en build"
        />
      </div>

      <ChangeRequestsKanbanBoard {...kanbanProps} />

      <DeleteChangeRequestDialog {...deleteDialogProps} />
    </section>
  );
}
