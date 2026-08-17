"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ChangeRequestItem,
  CreateChangeRequestInput,
} from "@/types/admin-ops";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import {
  buildSummaryCards,
  buildQualityChecks,
  groupRequestsByStatus,
  buildWorkflowRunMonitoring,
  buildChangeRequestMonitoring,
} from "./useAdminConsoleDerived-helpers";

interface UseAdminConsoleDerivedArgs {
  windowRange: MonitoringWindow;
  severity: SecuritySeverity | "all";
  monitoringSummary: { data?: { delivery_rate: number; bounce_rate: number } };
  monitoringAlerts: { data?: { alerts?: unknown[] } };
  securityActive: { data?: { alerts?: unknown[] } };
  changeRequests: { data?: { items?: ChangeRequestItem[] } };
  newRequest: CreateChangeRequestInput;
  crGuideDraft: {
    impact: string;
    successCriteria: string;
    rollbackPlan: string;
  };
}

export function useAdminConsoleDerived({
  windowRange,
  severity,
  monitoringSummary,
  monitoringAlerts,
  securityActive,
  changeRequests,
  newRequest,
  crGuideDraft,
}: UseAdminConsoleDerivedArgs) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const summaryCards = useMemo(
    () =>
      buildSummaryCards(
        monitoringSummary,
        monitoringAlerts,
        securityActive,
        windowRange,
        severity
      ),
    [
      monitoringAlerts,
      monitoringSummary,
      securityActive,
      severity,
      windowRange,
    ]
  );

  const qualityChecks = useMemo(
    () => buildQualityChecks(newRequest, crGuideDraft),
    [
      newRequest.problem,
      newRequest.desiredOutcome,
      newRequest.linkedRepo,
      newRequest.scope,
      crGuideDraft.impact,
      crGuideDraft.successCriteria,
      crGuideDraft.rollbackPlan,
    ]
  );

  const requestsByStatus = useMemo(
    () => groupRequestsByStatus(changeRequests.data?.items ?? []),
    [changeRequests.data?.items]
  );

  const workflowRunMonitoring = useMemo(
    () => buildWorkflowRunMonitoring(changeRequests.data?.items ?? []),
    [changeRequests.data?.items]
  );

  useEffect(() => {
    if (!workflowRunMonitoring.runs.length) {
      setSelectedRunId(null);
      return;
    }
    if (
      selectedRunId &&
      workflowRunMonitoring.runs.some((run) => run.item.id === selectedRunId)
    ) {
      return;
    }
    const preferred =
      workflowRunMonitoring.runs.find((r) => r.runState === "running") ||
      workflowRunMonitoring.runs.find((r) => r.runState === "queued") ||
      workflowRunMonitoring.runs[0];
    setSelectedRunId(preferred.item.id);
  }, [workflowRunMonitoring.runs, selectedRunId]);

  const selectedWorkflowRun = useMemo(() => {
    if (!workflowRunMonitoring.runs.length) return null;
    return (
      workflowRunMonitoring.runs.find((r) => r.item.id === selectedRunId) ||
      workflowRunMonitoring.runs[0]
    );
  }, [workflowRunMonitoring.runs, selectedRunId]);

  const selectedWorkflowRunEvents = useMemo(() => {
    if (!selectedWorkflowRun) return [];
    return (selectedWorkflowRun.item.workflowEvents ?? [])
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 20);
  }, [selectedWorkflowRun]);

  const changeRequestMonitoring = useMemo(
    () => buildChangeRequestMonitoring(changeRequests.data?.items ?? []),
    [changeRequests.data?.items]
  );

  return {
    selectedRunId,
    setSelectedRunId,
    summaryCards,
    qualityChecks,
    requestsByStatus,
    workflowRunMonitoring,
    selectedWorkflowRun,
    selectedWorkflowRunEvents,
    changeRequestMonitoring,
  };
}
