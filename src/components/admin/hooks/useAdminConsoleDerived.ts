"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Activity, ShieldCheck, Clock3 } from "lucide-react";
import type {
  ChangeRequestItem,
  CreateChangeRequestInput,
} from "@/types/admin-ops";
import {
  asInt,
  percent,
} from "@/components/admin/shared";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import {
  buildRequestsByStatus,
  buildWorkflowRunMonitoring,
  buildChangeRequestMonitoring,
} from "@/components/admin/hooks/admin-console-monitoring-builders";

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

  const summaryCards = useMemo(() => {
    const summary = monitoringSummary.data;
    const activeMonAlerts = monitoringAlerts.data?.alerts?.length ?? 0;
    const activeSecAlerts = securityActive.data?.alerts?.length ?? 0;
    return [
      {
        label: "Delivery rate",
        value: summary ? percent(summary.delivery_rate) : "—",
        note: "Emails livrés",
        icon: Activity,
      },
      {
        label: "Bounce rate",
        value: summary ? percent(summary.bounce_rate) : "—",
        note: "Hard + soft bounce",
        icon: AlertTriangle,
      },
      {
        label: "Alertes Monitoring",
        value: asInt(activeMonAlerts),
        note: `Fenêtre ${windowRange}`,
        icon: Clock3,
      },
      {
        label: "Alertes Sécurité",
        value: asInt(activeSecAlerts),
        note: severity === "all" ? "Toutes sévérités" : severity,
        icon: ShieldCheck,
      },
    ] as const;
  }, [
    monitoringAlerts.data,
    monitoringSummary.data,
    securityActive.data,
    severity,
    windowRange,
  ]);

  const qualityChecks = useMemo(() => {
    const checks = [
      {
        label: "Problème explicite (cause + symptôme)",
        ok: newRequest.problem.trim().length >= 40,
      },
      {
        label: "Impact utilisateur/business explicite",
        ok: /impact|client|utilisateur|business|latence|erreur/i.test(
          `${newRequest.problem} ${crGuideDraft.impact}`
        ),
      },
      {
        label: "Critères de succès mesurables",
        ok: /%|ms|slo|sla|kpi|p95|objectif|mesurable|test/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.successCriteria}`
        ),
      },
      {
        label: "Plan de rollback / mitigation",
        ok: /rollback|revert|fallback|mitigation/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.rollbackPlan}`
        ),
      },
      {
        label: "Portée repo + priorité cohérentes",
        ok:
          (newRequest.linkedRepo === "cross-repo" &&
            newRequest.scope === "fullstack") ||
          newRequest.linkedRepo !== "cross-repo",
      },
    ];
    return { checks, score: checks.filter((c) => c.ok).length };
  }, [
    newRequest.problem,
    newRequest.desiredOutcome,
    newRequest.linkedRepo,
    newRequest.scope,
    crGuideDraft.impact,
    crGuideDraft.successCriteria,
    crGuideDraft.rollbackPlan,
  ]);

  const requestsByStatus = useMemo(
    () => buildRequestsByStatus(changeRequests.data?.items ?? []),
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
