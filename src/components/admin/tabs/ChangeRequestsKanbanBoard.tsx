// ChangeRequestsKanbanBoard.tsx — vue kanban 4 colonnes des demandes.
// Extrait de ChangeRequestsTab.tsx (refactor architecte).
//
// Ce composant est un pur "view" : il reçoit toutes ses données et handlers
// en props, il n'a aucun état interne ni effet.

import React from "react";
import type { WorkflowStatus } from "@/types/admin-ops";
import { WORKFLOW_STATUS_COLUMNS, STATUS_LABEL } from "../admin-console-constants";
import { Badge, asDate, statusTone, priorityTone } from "../shared";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ChangeRequestsKanbanBoardProps {
  requestsByStatus: Record<WorkflowStatus, any[]>;
  handleStartImplementation: (id: string, currentStatus: WorkflowStatus) => void | Promise<unknown>;
  handleTransition: (id: string, action: string, currentStatus: WorkflowStatus) => void | Promise<unknown>;
  openDeleteChangeRequestDialog: (id: string, title: string) => void;
  startImplementationChangeRequest: { isPending: boolean };
  transitionChangeRequest: { isPending: boolean };
  deleteChangeRequest: { isPending: boolean };
}

export function ChangeRequestsKanbanBoard({
  requestsByStatus,
  handleStartImplementation,
  handleTransition,
  openDeleteChangeRequestDialog,
  startImplementationChangeRequest,
  transitionChangeRequest,
  deleteChangeRequest,
}: ChangeRequestsKanbanBoardProps) {
  return (
      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        {WORKFLOW_STATUS_COLUMNS.map((status: WorkflowStatus) => (
          <article
            key={status}
            className="rounded-xl border border-[#232327] bg-[#151518] p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                {STATUS_LABEL[status]}
              </h3>
              <Badge tone={statusTone(status)}>
                {requestsByStatus[status].length}
              </Badge>
            </div>
            <div className="space-y-2">
              {requestsByStatus[status].map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#E4E4E7]">{item.title}</p>
                    <Badge tone={priorityTone(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    {item.desiredOutcome}
                  </p>
                  <p className="mt-1 text-[11px] text-[#71717A]">
                    {item.linkedRepo} · {item.targetReleaseWindow} ·{" "}
                    {item.id}
                  </p>
                  <p className="mt-1 text-[11px] text-[#A1A1AA]">
                    prise en charge: {item.takenInChargeBy || "—"} ·{" "}
                    {asDate(item.takenInChargeAt || "")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-[#3A3A42] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
                      disabled={
                        item.status === "released" ||
                        item.status === "rejected" ||
                        transitionChangeRequest.isPending ||
                        startImplementationChangeRequest.isPending ||
                        deleteChangeRequest.isPending
                      }
                      onClick={() =>
                        void handleTransition(
                          item.id,
                          "advance",
                          item.status
                        )
                      }
                    >
                      Étape suivante
                    </button>
                    {(item.status === "submitted" ||
                      item.status === "triaged" ||
                      item.status === "planned") && (
                      <button
                        type="button"
                        className="rounded-md border border-[#1F4D3E] bg-[#132C24] px-2 py-1 text-[11px] text-[#86EFAC] disabled:opacity-50"
                        disabled={
                          transitionChangeRequest.isPending ||
                          startImplementationChangeRequest.isPending ||
                          deleteChangeRequest.isPending
                        }
                        onClick={() =>
                          void handleStartImplementation(
                            item.id,
                            item.status
                          )
                        }
                      >
                        {startImplementationChangeRequest.isPending
                          ? "Lancement..."
                          : "Lancer implémentation"}
                      </button>
                    )}
                    {(item.status === "in_progress" ||
                      item.status === "qa") && (
                      <button
                        type="button"
                        className="rounded-md border border-[#4A3B1F] bg-[#2B2210] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
                        disabled={
                          transitionChangeRequest.isPending ||
                          startImplementationChangeRequest.isPending ||
                          deleteChangeRequest.isPending
                        }
                        onClick={() =>
                          void handleTransition(
                            item.id,
                            "stop",
                            item.status
                          )
                        }
                      >
                        Arrêter
                      </button>
                    )}
                    {item.status !== "released" &&
                      item.status !== "rejected" && (
                        <button
                          type="button"
                          className="rounded-md border border-[#5E4A20] bg-[#2B2413] px-2 py-1 text-[11px] text-[#FCD34D] disabled:opacity-50"
                          disabled={
                            transitionChangeRequest.isPending ||
                            startImplementationChangeRequest.isPending ||
                            deleteChangeRequest.isPending
                          }
                          onClick={() =>
                            void handleTransition(
                              item.id,
                              "cancel",
                              item.status
                            )
                          }
                        >
                          Annuler
                        </button>
                      )}
                    <button
                      type="button"
                      className="rounded-md border border-[#5B1F27] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                      disabled={
                        item.status === "released" ||
                        item.status === "rejected" ||
                        transitionChangeRequest.isPending ||
                        startImplementationChangeRequest.isPending ||
                        deleteChangeRequest.isPending
                      }
                      onClick={() =>
                        void handleTransition(
                          item.id,
                          "reject",
                          item.status
                        )
                      }
                    >
                      Rejeter
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-[#60292F] bg-[#2A1418] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                      disabled={
                        transitionChangeRequest.isPending ||
                        startImplementationChangeRequest.isPending ||
                        deleteChangeRequest.isPending
                      }
                      onClick={() =>
                        openDeleteChangeRequestDialog(item.id, item.title)
                      }
                    >
                      {deleteChangeRequest.isPending
                        ? "Suppression..."
                        : "Supprimer"}
                    </button>
                  </div>
                </div>
              ))}
              {!requestsByStatus[status].length && (
                <p className="text-xs text-[#71717A]">Aucune demande.</p>
              )}
            </div>
          </article>
        ))}
      </div>
  );
}
