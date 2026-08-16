"use client";
import React from "react";
import { cn } from "@/lib/utils";
import {
  Badge,
  asInt,
  formatDurationMinutes,
  runStateTone,
  runStateLabel,
  executionStateTone,
  executionStateLabel,
} from "../../shared";

export interface WorkflowRunsListProps {
  workflowRunMonitoring: any;
  selectedWorkflowRun: any;
  setSelectedRunId: (id: string) => void;
}

export function WorkflowRunsList({
  workflowRunMonitoring,
  selectedWorkflowRun,
  setSelectedRunId,
}: WorkflowRunsListProps) {
  return (
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
        {workflowRunMonitoring.runs.map((run: any) => (
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
  );
}
