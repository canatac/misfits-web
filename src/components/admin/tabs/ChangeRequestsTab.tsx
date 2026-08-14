"use client";

// ChangeRequestsTab.tsx — extracted Sprint 3
import { useMemo, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  ChangeRequestItem,
  WorkflowStatus,
  ChangeRequestsResponse,
  ChangeRequestGuideDraft,
} from "@/types/admin-ops";
import type {
  useTransitionChangeRequest,
  useStartImplementationChangeRequest,
  useCreateChangeRequest,
  useDeleteChangeRequest,
} from "@/hooks/use-admin-ops";
import { Badge, asDate, priorityTone, statusTone,
  runStateFromStatus, runStateTone, runStateLabel,
  executionStateTone, executionStateLabel, minutesBetween } from "../shared";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const WORKFLOW_STATUS_COLUMNS: WorkflowStatus[] = [
  "draft", "review", "approved", "in_progress", "done", "rejected",
];
const STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft: "Brouillon", review: "En revue", approved: "Approuvé",
  in_progress: "En cours", done: "Terminé", rejected: "Rejeté",
};

interface ChangeRequestsTabProps {
  changeRequests: UseQueryResult<ChangeRequestsResponse, Error>;
  createChangeRequest: ReturnType<typeof useCreateChangeRequest>;
  deleteChangeRequest: ReturnType<typeof useDeleteChangeRequest>;
  transitionChangeRequest: ReturnType<typeof useTransitionChangeRequest>;
  startImplementation: ReturnType<typeof useStartImplementationChangeRequest>;
  adminDataLoading: boolean;
  adminDataError: string | null;
  crGuideInput: string;
  setCrGuideInput: React.Dispatch<React.SetStateAction<string>>;
  crGuideLoading: boolean;
  crGuideError: string | null;
  handleCrGuide: (e: React.FormEvent) => void;
}

export function ChangeRequestsTab({
  changeRequests,
  createChangeRequest,
  deleteChangeRequest,
  transitionChangeRequest,
  startImplementation,
  adminDataLoading,
  adminDataError,
  crGuideInput,
  setCrGuideInput,
  crGuideLoading,
  crGuideError,
  handleCrGuide,
}: ChangeRequestsTabProps) {

  const kanbanColumns = useMemo(() => {
    const cols = new Map<WorkflowStatus, ChangeRequestItem[]>();
    WORKFLOW_STATUS_COLUMNS.forEach((s) => cols.set(s, []));
    for (const item of changeRequests.data?.items ?? []) {
      const col = cols.get(item.status as WorkflowStatus);
      if (col) col.push(item);
    }
    return cols;
  }, [changeRequests.data?.items]);

  const workflowRunMonitoring = useMemo(() => {
    const items = changeRequests.data?.items ?? [];
    const nowIso = new Date().toISOString();

    const runs = items
      .map((item) => {
        const runState = runStateFromStatus(item.status);
        const totalStages = item.workflow?.length ?? 0;
        const doneStages = (item.workflow ?? []).filter(
          (stage) => stage.status === "done"
        ).length;
        const progressPct =
          totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;
        const currentStage =
          (item.workflow ?? []).find((stage) => stage.status === "active") ??
          (item.workflow ?? [])[Math.max(0, doneStages - 1)] ??
          null;
        const startedAt = item.takenInChargeAt || item.createdAt;
        const elapsedMinutes = minutesBetween(startedAt, nowIso);
        const latestEvent = (item.workflowEvents ?? [])
          .slice()
          .sort(
            (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
          )[0];
        const lastEventAt = latestEvent?.at || item.updatedAt;
        const lastEventAgeMinutes = minutesBetween(lastEventAt, nowIso);
        const executionState = item.executionState ?? "idle";
        const executionHeartbeatAt = item.executionLastHeartbeatAt || null;
        const executionHeartbeatAgeMinutes = minutesBetween(
          executionHeartbeatAt || undefined,
          nowIso
        );
        const hasExecutionSignal =
          executionState === "running" ||
          executionState === "success" ||
          executionState === "failed";
        const appearsWorkflowOnly =
          runState === "running" &&
          (executionState === "idle" || executionState === "queued") &&
          (executionHeartbeatAgeMinutes === null ||
            executionHeartbeatAgeMinutes > 5);

        return {
          item,
          runState,
          totalStages,
          doneStages,
          progressPct,
          currentStage,
          elapsedMinutes,
          lastEventAt,
          lastEventAgeMinutes,
          executionState,
          executionHeartbeatAt,
          executionHeartbeatAgeMinutes,
          hasExecutionSignal,
          appearsWorkflowOnly,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastEventAt).getTime() - new Date(a.lastEventAt).getTime()
      );

    return {
      runs,
      running: runs.filter((run) => run.runState === "running").length,
      queued: runs.filter((run) => run.runState === "queued").length,
      completed: runs.filter((run) => run.runState === "completed").length,
      failed: runs.filter((run) => run.runState === "failed").length,
      workflowOnlyRunning: runs.filter((run) => run.appearsWorkflowOnly).length,
    };
  }, [changeRequests.data?.items]);

  const [crForm, setCrForm] = useState({
    title: "", description: "", priority: "medium" as const, tags: [] as string[],
  });

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
            <Badge tone={changeRequests.isFetching ? "warn" : "ok"}>
              {changeRequests.isFetching ? "syncing" : "workflow live"}
            </Badge>
          </div>

          <div className="mb-3 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
            <p className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Déploiement requis
            </p>
            <p className="mt-1 text-[#E5E7EB]">
              Une CR peut passer en &quot;implémentée&quot; côté workflow, mais
              les changements code (misfits-web / reimagined-guide) nécessitent
              merge + redémarrage/déploiement des services concernés pour être
              visibles.
            </p>
          </div>

          <div className="mb-3 grid gap-3 xl:grid-cols-3">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Console backend (source de vérité)
                </h3>
                <Badge tone={adminDataLoading ? "warn" : "ok"}>
                  {adminDataLoading ? "syncing" : "live"}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-[#A1A1AA]">
                Preuves backend de l&apos;activité réelle (queue, débit,
                erreurs), distinctes du simple statut workflow.
              </p>
              <div className="mt-2 grid gap-2 text-[11px] md:grid-cols-3">
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
                  queue depth:{" "}
                  {asInt(observability?.health_realtime?.queue?.depth ?? 0)}
                </div>
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
                  in/out min:{" "}
                  {observability?.health_realtime?.throughput?.incoming_per_min?.toFixed(
                    1
                  ) ?? "0.0"}
                  /
                  {observability?.health_realtime?.throughput?.outgoing_per_min?.toFixed(
                    1
                  ) ?? "0.0"}
                </div>
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
                  smtp 5xx:{" "}
                  {percent(
                    observability?.health_realtime?.delivery?.smtp_5xx_rate ?? 0
                  )}
                </div>
              </div>
              <div className="mt-2 text-[11px] text-[#A1A1AA]">
                <p>
                  success rate:{" "}
                  {percent(
                    observability?.health_realtime?.delivery?.success_rate ?? 0
                  )}{" "}
                  · p95:{" "}
                  {asInt(
                    observability?.health_realtime?.delivery?.p95_total_ms ?? 0
                  )}{" "}
                  ms
                </p>
                <p>
                  alerts queue/auth:{" "}
                  {asInt(
                    observability?.proactive_alerting?.threshold_alerts
                      ?.queue_growth ?? 0
                  )}
                  /
                  {asInt(
                    observability?.proactive_alerting?.threshold_alerts
                      ?.auth_failures ?? 0
                  )}
                </p>
                {adminDataError && (
                  <p className="mt-1 text-[#FCA5A5]">
                    backend indisponible: {adminDataError}
                  </p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <p className="text-xs text-[#A1A1AA]">CR totales</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.total)}
              </p>
              <p className="mt-2 text-xs text-[#A1A1AA]">En cours</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.wip)}
              </p>
              <p className="mt-2 text-xs text-[#A1A1AA]">Prises en charge</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(changeRequestMonitoring.takenCount)}
              </p>
              <p className="mt-2 text-xs text-[#A1A1AA]">
                Délai moyen prise en charge
              </p>
              <p className="mt-1 text-sm font-semibold text-[#E4E4E7]">
                {formatDurationMinutes(
                  changeRequestMonitoring.avgTriageMinutes
                )}
              </p>
            </article>
          </div>

          <div className="mb-3 grid gap-3 xl:grid-cols-2">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Dernières prises en charge / transitions
              </h3>
              <div className="mt-2 space-y-2">
                {changeRequestMonitoring.latestEvents.map((event) => (
                  <div
                    key={`${event.requestId}-${event.at}-${event.action}`}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <p className="text-xs text-[#E4E4E7]">
                      {event.requestId} · {event.fromStatus} → {event.toStatus}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA]">
                      {event.actor} · {asDate(event.at)}
                    </p>
                    {event.note && (
                      <p className="mt-1 text-[11px] text-[#71717A]">
                        {event.note}
                      </p>
                    )}
                  </div>
                ))}
                {!changeRequestMonitoring.latestEvents.length && (
                  <p className="text-xs text-[#71717A]">
                    Aucun événement workflow pour le moment.
                  </p>
                )}
              </div>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                État des lieux (CR les plus anciennes)
              </h3>
              <div className="mt-2 space-y-2">
                {changeRequestMonitoring.stalled.map(({ item, ageMinutes }) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-[#E4E4E7]">{item.id}</p>
                      <Badge tone={statusTone(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-[#A1A1AA]">
                      Inactif depuis {formatDurationMinutes(ageMinutes)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#71717A]">
                      prise en charge: {item.takenInChargeBy || "—"} ·{" "}
                      {asDate(item.takenInChargeAt || "")}
                    </p>
                  </div>
                ))}
                {!changeRequestMonitoring.stalled.length && (
                  <p className="text-xs text-[#71717A]">
                    Aucune CR en attente prolongée.
                  </p>
                )}
              </div>
            </article>
          </div>

          <div className="mb-3 grid gap-3 xl:grid-cols-3">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-1">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Runs workflow
                </h3>
                <Badge tone={workflowRunMonitoring.running ? "ok" : "neutral"}>
                  {workflowRunMonitoring.running} running
                </Badge>
              </div>

              <div className="mb-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#A1A1AA]">
                  queued: {asInt(workflowRunMonitoring.queued)}
                </div>
                <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#A1A1AA]">
                  failed: {asInt(workflowRunMonitoring.failed)}
                </div>
              </div>

              {workflowRunMonitoring.workflowOnlyRunning > 0 && (
                <div className="mb-2 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
                  {workflowRunMonitoring.workflowOnlyRunning} run(s) en statut
                  running sans signal d&apos;exécution technique récent.
                </div>
              )}

              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {workflowRunMonitoring.runs.map((run) => (
                  <button
                    key={run.item.id}
                    type="button"
                    onClick={() => setSelectedRunId(run.item.id)}
                    className={cn(
                      "w-full rounded-lg border p-2 text-left",
                      selectedWorkflowRun?.item.id === run.item.id
                        ? "border-[#C49B66] bg-[#2A2218]"
                        : "border-[#2A2A30] bg-[#111114] hover:border-[#3A3A42]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium text-[#E4E4E7]">
                        {run.item.id}
                      </p>
                      <Badge tone={runStateTone(run.runState)}>
                        {runStateLabel(run.runState)}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-[#A1A1AA]">
                      {run.item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[#71717A]">
                      stage: {run.currentStage?.label || "—"} · {run.doneStages}
                      /{run.totalStages}
                    </p>
                    <p className="text-[11px] text-[#71717A]">
                      elapsed: {formatDurationMinutes(run.elapsedMinutes)}
                    </p>
                    <p
                      className={cn(
                        "text-[11px]",
                        run.appearsWorkflowOnly
                          ? "text-[#FCD34D]"
                          : "text-[#86EFAC]"
                      )}
                    >
                      {run.appearsWorkflowOnly
                        ? "signal: workflow uniquement"
                        : "signal: activité technique détectée"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={executionStateTone(run.executionState)}>
                        exec {executionStateLabel(run.executionState)}
                      </Badge>
                      {run.item.executionRunId && (
                        <span className="text-[10px] text-[#71717A]">
                          run {run.item.executionRunId}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {!workflowRunMonitoring.runs.length && (
                  <p className="text-xs text-[#71717A]">
                    Aucun run disponible.
                  </p>
                )}
              </div>
            </article>

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

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedWorkflowRun.item.status === "submitted" ||
                        selectedWorkflowRun.item.status === "triaged" ||
                        selectedWorkflowRun.item.status === "planned") && (
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
                              selectedWorkflowRun.item.id,
                              selectedWorkflowRun.item.status
                            )
                          }
                        >
                          relancer run
                        </button>
                      )}
                      {(selectedWorkflowRun.item.status === "in_progress" ||
                        selectedWorkflowRun.item.status === "qa") && (
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
                              selectedWorkflowRun.item.id,
                              "stop",
                              selectedWorkflowRun.item.status
                            )
                          }
                        >
                          stop run
                        </button>
                      )}
                      {selectedWorkflowRun.item.status !== "released" &&
                        selectedWorkflowRun.item.status !== "rejected" && (
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
                                selectedWorkflowRun.item.id,
                                "cancel",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            cancel run
                          </button>
                        )}
                      {(selectedWorkflowRun.item.status === "in_progress" ||
                        selectedWorkflowRun.item.status === "qa") && (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-[#3A3A42] bg-[#17171B] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_start",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            signaler start backend
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#3A3A42] bg-[#17171B] px-2 py-1 text-[11px] text-[#D4D4D8] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_heartbeat",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            heartbeat
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#1F4D3E] bg-[#132C24] px-2 py-1 text-[11px] text-[#86EFAC] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_success",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            signaler success
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-[#5B1F27] bg-[#2B1419] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                            disabled={
                              transitionChangeRequest.isPending ||
                              startImplementationChangeRequest.isPending ||
                              deleteChangeRequest.isPending
                            }
                            onClick={() =>
                              void handleTransition(
                                selectedWorkflowRun.item.id,
                                "execution_fail",
                                selectedWorkflowRun.item.status
                              )
                            }
                          >
                            signaler échec
                          </button>
                        </>
                      )}
                    </div>

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
                          (stage) => (
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
                        {selectedWorkflowRunEvents.map((event) => (
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
          </div>

          <div className="grid gap-3 xl:grid-cols-5">
            <form
              onSubmit={handleCreateChangeRequest}
              className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-3"
            >
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Nouvelle demande
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={newRequest.title}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                  placeholder="Titre (ex: Flux changelog + CR admin)"
                  required
                  minLength={8}
                />
                <input
                  value={newRequest.requestedBy}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      requestedBy: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                  placeholder="Requested by"
                  required
                />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <select
                  value={newRequest.scope}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      scope: e.target
                        .value as CreateChangeRequestInput["scope"],
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="ux">Scope UX</option>
                  <option value="backend">Scope Backend</option>
                  <option value="fullstack">Scope Fullstack</option>
                  <option value="security">Scope Security</option>
                </select>
                <select
                  value={newRequest.urgency}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      urgency: e.target
                        .value as CreateChangeRequestInput["urgency"],
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="low">Urgence low</option>
                  <option value="medium">Urgence medium</option>
                  <option value="high">Urgence high</option>
                </select>
                <select
                  value={newRequest.impact}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      impact: e.target
                        .value as CreateChangeRequestInput["impact"],
                    }))
                  }
                  className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="small">Impact small</option>
                  <option value="medium">Impact medium</option>
                  <option value="high">Impact high</option>
                </select>
              </div>
              <div className="mt-2">
                <select
                  value={newRequest.linkedRepo}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      linkedRepo: e.target
                        .value as CreateChangeRequestInput["linkedRepo"],
                    }))
                  }
                  className="w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
                >
                  <option value="misfits-web">Repo: misfits-web</option>
                  <option value="reimagined-guide">
                    Repo: reimagined-guide
                  </option>
                  <option value="cross-repo">Repo: cross-repo</option>
                </select>
              </div>
              <textarea
                value={newRequest.problem}
                onChange={(e) =>
                  setNewRequest((prev) => ({
                    ...prev,
                    problem: e.target.value,
                  }))
                }
                className="mt-2 h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                placeholder="Problème à résoudre"
                minLength={16}
                required
              />
              <textarea
                value={newRequest.desiredOutcome}
                onChange={(e) =>
                  setNewRequest((prev) => ({
                    ...prev,
                    desiredOutcome: e.target.value,
                  }))
                }
                className="mt-2 h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
                placeholder="Résultat attendu + critères de succès"
                minLength={16}
                required
              />
              <button
                type="submit"
                className="mt-2 rounded-lg border border-[#C49B66] bg-[#2A2218] px-3 py-1.5 text-xs font-semibold text-[#F2D5A7] disabled:opacity-50"
                disabled={
                  createChangeRequest.isPending || qualityChecks.score < 4
                }
              >
                {createChangeRequest.isPending
                  ? "Création..."
                  : "Créer et lancer le workflow"}
              </button>
              {qualityChecks.score < 4 && (
                <p className="mt-2 text-xs text-[#FCD34D]">
                  Complète au moins 4/5 critères qualité via l&apos;assistant
                  chat avant soumission.
                </p>
              )}
            </form>

            <aside className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                  Assistant chat — formulation CR
                </h3>
                <Badge tone={qualityChecks.score >= 4 ? "ok" : "warn"}>
                  qualité {qualityChecks.score}/5
                </Badge>
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Discute avec Hermes pour structurer la demande. Il reformule et
                alimente automatiquement le formulaire.
              </p>

              <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
                {crGuideMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      "max-w-[92%] rounded-md px-2 py-1.5 text-xs leading-relaxed",
                      message.role === "assistant"
                        ? "border border-[#2A2A30] bg-[#151518] text-[#D4D4D8]"
                        : "ml-auto border border-[#4A3921] bg-[#2A2218] text-[#F2D5A7]"
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <form className="mt-2 space-y-2" onSubmit={handleGuideChatSubmit}>
                <textarea
                  value={crGuideInput}
                  onChange={(e) => setCrGuideInput(e.target.value)}
                  className="h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
                  placeholder="Réponds au message Hermes (ex: impact, KPI, rollback, etc.)"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={crGuideLoading || !crGuideInput.trim()}
                    className="rounded-lg border border-[#C49B66] bg-[#2A2218] px-2.5 py-1.5 text-xs font-semibold text-[#F2D5A7] disabled:opacity-50"
                  >
                    {crGuideLoading ? "Hermes rédige…" : "Envoyer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGuideToForm()}
                    className="rounded-lg border border-[#3A3A42] px-2.5 py-1.5 text-xs text-[#D4D4D8]"
                  >
                    Appliquer au formulaire
                  </button>
                </div>
                {crGuideError && (
                  <p className="text-xs text-[#FCA5A5]">
                    Assistant indisponible: {crGuideError}
                  </p>
                )}
              </form>

              <div className="mt-3 rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
                <p className="mb-1 text-[11px] text-[#A1A1AA]">
                  Checklist qualité
                </p>
                <div className="space-y-1">
                  {qualityChecks.checks.map((check) => (
                    <p
                      key={check.label}
                      className={cn(
                        "text-xs",
                        check.ok ? "text-[#86EFAC]" : "text-[#FCD34D]"
                      )}
                    >
                      {check.ok ? "✓" : "•"} {check.label}
                    </p>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-3 rounded-xl border border-[#232327] bg-[#151518] p-3">
            <label className="text-xs text-[#A1A1AA]">
              Note de transition (optionnelle)
            </label>
            <input
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
              placeholder="Ex: spec validée, passage en build"
            />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-4">
            {WORKFLOW_STATUS_COLUMNS.map((status) => (
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
                  {requestsByStatus[status].map((item) => (
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
                          Advance
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
                          Reject
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
                            void handleDeleteChangeRequest(item.id)
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
        </section>
  );
}
