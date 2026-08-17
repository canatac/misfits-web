import type {
  ChangeRequestItem,
  WorkflowStatus,
} from "@/types/admin-ops";
import {
  minutesBetween,
  runStateFromStatus,
} from "@/components/admin/shared";
import { WORKFLOW_STATUS_COLUMNS } from "@/components/admin/admin-console-constants";

export function buildRequestsByStatus(items: ChangeRequestItem[]) {
  const grouped = Object.fromEntries(
    WORKFLOW_STATUS_COLUMNS.map((status: WorkflowStatus) => [
      status,
      [] as ChangeRequestItem[],
    ])
  ) as Record<WorkflowStatus, ChangeRequestItem[]>;
  for (const item of items) {
    grouped[item.status].push(item);
  }
  return grouped;
}

export function buildWorkflowRunMonitoring(items: ChangeRequestItem[]) {
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
    running: runs.filter((r) => r.runState === "running").length,
    queued: runs.filter((r) => r.runState === "queued").length,
    completed: runs.filter((r) => r.runState === "completed").length,
    failed: runs.filter((r) => r.runState === "failed").length,
    workflowOnlyRunning: runs.filter((r) => r.appearsWorkflowOnly).length,
  };
}

export function buildChangeRequestMonitoring(items: ChangeRequestItem[]) {
  const nowIso = new Date().toISOString();
  const taken = items.filter((item) => !!item.takenInChargeAt);
  const triageMinutes = taken
    .map((item) => minutesBetween(item.createdAt, item.takenInChargeAt))
    .filter((v): v is number => v !== null);
  const avgTriageMinutes = triageMinutes.length
    ? Math.round(
        triageMinutes.reduce((acc, v) => acc + v, 0) / triageMinutes.length
      )
    : null;
  const wip = items.filter(
    (item) => item.status !== "released" && item.status !== "rejected"
  ).length;
  const stalled = items
    .map((item) => ({
      item,
      ageMinutes: minutesBetween(item.updatedAt, nowIso) ?? 0,
    }))
    .filter((entry) => entry.item.status !== "released")
    .sort((a, b) => b.ageMinutes - a.ageMinutes)
    .slice(0, 3);
  const latestEvents = items
    .flatMap((item) =>
      (item.workflowEvents ?? []).map((event) => ({
        ...event,
        requestId: item.id,
        requestTitle: item.title,
      }))
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
  return {
    total: items.length,
    wip,
    takenCount: taken.length,
    avgTriageMinutes,
    stalled,
    latestEvents,
  };
}
