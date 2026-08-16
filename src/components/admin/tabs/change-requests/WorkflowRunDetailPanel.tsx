"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Badge,
  asDate,
  formatDurationMinutes,
  runStateTone,
  runStateLabel,
  executionStateTone,
  executionStateLabel,
} from "../../shared";
import { WorkflowRunActions } from "./WorkflowRunActions";

export interface WorkflowRunDetailPanelProps {
  selectedWorkflowRun: any;
  selectedWorkflowRunEvents: any[];
  transitionChangeRequest: any;
  startImplementationChangeRequest: any;
  deleteChangeRequest: any;
  handleStartImplementation: (id: string, status: string) => void | Promise<void>;
  handleTransition: (id: string, action: string, status: string) => void | Promise<void>;
}

export function WorkflowRunDetailPanel({
  selectedWorkflowRun,
  selectedWorkflowRunEvents,
  transitionChangeRequest,
  startImplementationChangeRequest,
  deleteChangeRequest,
  handleStartImplementation,
  handleTransition,
}: WorkflowRunDetailPanelProps) {
  return (
    <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
          Run details (style GitHub Actions)
        </h3>
        {selectedWorkflowRun && (
          <Badge tone={runStateTone(selectedWorkflowRun.runState)}>
            {selectedWorkflowRun.item.id} ·{" "}
            {runStateLabel(selectedWorkflowRun.runState)}
          </Badge>
        )}
      </div>

      {selectedWorkflowRun ? (
        <>
          <div className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#E4E4E7]">
                {selectedWorkflowRun.item.title}
              </p>
              <p className="text-[11px] text-[#A1A1AA]">
                updated {asDate(selectedWorkflowRun.item.updatedAt)}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#232327]">
              <div
                className={cn(
                  "h-full rounded-full",
                  selectedWorkflowRun.runState === "failed"
                    ? "bg-[#FCA5A5]"
                    : selectedWorkflowRun.runState === "completed"
                      ? "bg-[#86EFAC]"
                      : "bg-[#F2D5A7]"
                )}
                style={{ width: `${selectedWorkflowRun.progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-[#A1A1AA]">
              progress {selectedWorkflowRun.progressPct}% · stage actif:{" "}
              {selectedWorkflowRun.currentStage?.label || "—"} · elapsed{" "}
              {formatDurationMinutes(
                selectedWorkflowRun.elapsedMinutes
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#A1A1AA]">
              <Badge
                tone={executionStateTone(
                  selectedWorkflowRun.executionState
                )}
              >
                execution{" "}
                {executionStateLabel(
                  selectedWorkflowRun.executionState
                )}
              </Badge>
              <span>
                heartbeat:{" "}
                {asDate(selectedWorkflowRun.executionHeartbeatAt || "")}
              </span>
              {selectedWorkflowRun.item.executionLastError && (
                <span className="text-[#FCA5A5]">
                  error: {selectedWorkflowRun.item.executionLastError}
                </span>
              )}
            </div>

            {selectedWorkflowRun.appearsWorkflowOnly && (
              <div className="mt-2 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
                Statut &quot;running&quot; détecté, mais aucun signal de
                build/test/deploy récent. Cette CR semble en
                orchestration workflow uniquement.
              </div>
            )}

            <WorkflowRunActions
              selectedWorkflowRun={selectedWorkflowRun}
              transitionChangeRequest={transitionChangeRequest}
              startImplementationChangeRequest={startImplementationChangeRequest}
              deleteChangeRequest={deleteChangeRequest}
              handleStartImplementation={handleStartImplementation}
              handleTransition={handleTransition}
            />

            <div className="mt-3 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
              <p className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Déploiement requis
              </p>
              <p className="mt-1 text-[#E5E7EB]">
                Les transitions CR pilotent le workflow produit, mais
                les changements de code (misfits-web / reimagined-guide)
                ne sont visibles qu&apos;après merge +
                déploiement/restart des services concernés.
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3">
              <p className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Jobs
              </p>
              <div className="mt-2 space-y-2">
                {(selectedWorkflowRun.item.workflow ?? []).map(
                  (stage: any) => (
                    <div
                      key={stage.key}
                      className="rounded-md border border-[#2A2A30] bg-[#151518] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#E4E4E7]">
                          {stage.label}
                        </p>
                        <Badge
                          tone={
                            stage.status === "done"
                              ? "ok"
                              : stage.status === "active"
                                ? "warn"
                                : "neutral"
                          }
                        >
                          {stage.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-[#71717A]">
                        owner: {stage.owner} · done:{" "}
                        {asDate(stage.doneAt || "")}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[#2A2A30] bg-[#111114] p-3">
              <p className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Logs (latest 20)
              </p>
              <div className="mt-2 max-h-[280px] space-y-1 overflow-y-auto rounded-md border border-[#2A2A30] bg-[#0D0D10] p-2 font-mono text-[11px]">
                {selectedWorkflowRunEvents.map((event: any) => (
                  <div
                    key={`${event.at}-${event.action}-${event.fromStatus}`}
                  >
                    <span className="text-[#71717A]">
                      {asDate(event.at)}
                    </span>{" "}
                    <span className="text-[#E4E4E7]">
                      {event.actor}
                    </span>{" "}
                    <span className="text-[#F2D5A7]">
                      {event.action}
                    </span>{" "}
                    <span className="text-[#A1A1AA]">
                      {event.fromStatus}→{event.toStatus}
                    </span>
                    {event.note ? (
                      <span className="text-[#86EFAC]">
                        {" "}
                        · {event.note}
                      </span>
                    ) : null}
                  </div>
                ))}
                {!selectedWorkflowRunEvents.length && (
                  <p className="text-[#71717A]">
                    Aucun log pour ce run.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-[#71717A]">
          Sélectionne un run pour voir son exécution détaillée.
        </p>
      )}
    </article>
  );
}
