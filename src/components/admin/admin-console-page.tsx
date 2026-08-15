"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Activity, ShieldCheck, Clock3 } from "lucide-react";
import {
  useMonitoringAlerts,
  useMonitoringBounces,
  useMonitoringLive,
  useMonitoringProviders,
  useMonitoringSummary
} from "@/hooks/use-monitoring";
import {
  useSecurityActiveAlerts,
  useSecurityIncidents,
  useSecurityLive
} from "@/hooks/use-security-dashboard";
import {
  useAdminAiActivity,
  useAdminAuditLog,
  useAdminChangelog,
  useAdminUsers,
  useAdminWhoami,
  useChangeRequests,
  useCreateAdminUser,
  useCreateChangeRequest,
  useDeleteChangeRequest,
  useDeleteAdminUser,
  useInviteAdminUser,
  useResetAdminPassword,
  useStartImplementationChangeRequest,
  useTransitionChangeRequest,
  useUpdateAdminUser
} from "@/hooks/use-admin-ops";
import type {
  ChangeRequestItem,
  CreateAdminUserInput,
  CreateChangeRequestInput,
  WorkflowStatus,
  AdminUserRecord} from "@/types/admin-ops";
import {
  Badge,
  asDate,
  asInt,
  percent,
  minutesBetween,
  formatDurationMinutes,
  priorityTone,
  statusTone,
  runStateFromStatus,
  runStateTone,
  runStateLabel,
  executionStateTone,
  executionStateLabel
} from "./shared";
import { ChangelogTab } from "./tabs/ChangelogTab";
import { ChangeRequestsTab } from "./tabs/ChangeRequestsTab";
import { DeliverabilityOpsTab } from "./tabs/DeliverabilityOpsTab";
import { AdminOverviewSections, type LocalSecurityPosture, type LocalObservabilityOverview } from "./tabs/AdminOverviewSections";
import { UsersTab } from "./tabs/UsersTab";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";

// Types et constantes admin console — extraits vers un module dédié
// (refactor itération architecte, novembre 2026) pour aérer ce fichier
// et faciliter leur réutilisation par les sous-composants de tab.
import {
  type AdminTab,
  WINDOW_OPTIONS,
  SEVERITY_OPTIONS,
  WORKFLOW_STATUS_COLUMNS,
  STATUS_LABEL,
} from "./admin-console-constants";


import type {
  AdminDeliverabilityDiagnosticsResponse,
  DeliverabilityProcedureData,
  AdminObservabilityOverviewResponse,
} from "@/types/admin-console";
import { useAdminData } from "@/hooks/useAdminData";
import { useCrGuide, type ChangeRequestChatMessage, type ChangeRequestGuideDraft, type ChangeRequestChatField } from "@/hooks/useCrGuide";
import { useAdminAssistant } from "@/hooks/useAdminAssistant";
import { useAdminActions } from "@/hooks/useAdminActions";

export function AdminConsolePage({
  initialTab = "overview"
}: {
  initialTab?: AdminTab;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [windowRange, setWindowRange] = useState<MonitoringWindow>("24h");
  const [severity, setSeverity] = useState<SecuritySeverity | "all">("all");

  const monitoringSummary = useMonitoringSummary(windowRange);
  const monitoringAlerts = useMonitoringAlerts(windowRange);
  const monitoringProviders = useMonitoringProviders(windowRange);
  const monitoringBounces = useMonitoringBounces(windowRange);
  const monitoringLive = useMonitoringLive({
    enabled: activeTab !== "changelog"
  });

  const securitySeverityFilter = severity === "all" ? undefined : severity;
  const securityActive = useSecurityActiveAlerts({
    window: windowRange,
    severity: securitySeverityFilter
  });
  const securityIncidents = useSecurityIncidents({
    page: 1,
    page_size: 20,
    severity: securitySeverityFilter
  });
  const securityLive = useSecurityLive({ enabled: activeTab !== "changelog" });

  const adminChangelog = useAdminChangelog();
  const changeRequests = useChangeRequests();
  const adminUsers = useAdminUsers();
  const whoami = useAdminWhoami();
  // Effective role gate: when RBAC is enforced on the backend, hide CRUD
  // affordances for anything other than an admin. When RBAC is OFF, the
  // backend answers { role: "admin", enforced: false } so canWriteUsers
  // stays true and the current behaviour is preserved.
  const canWriteUsers = (whoami.data?.role ?? "admin") === "admin";
  const rbacEnforced = whoami.data?.enforced === true;
  const inviteAdminUser = useInviteAdminUser();
  const resetAdminPassword = useResetAdminPassword();
  const adminAuditLog = useAdminAuditLog(100);
  const adminAiActivity = useAdminAiActivity(50);
  const createChangeRequest = useCreateChangeRequest();
  const transitionChangeRequest = useTransitionChangeRequest();
  const deleteChangeRequest = useDeleteChangeRequest();
  const startImplementationChangeRequest =
    useStartImplementationChangeRequest();
  const updateAdminUser = useUpdateAdminUser();
  const createAdminUser = useCreateAdminUser();
  const deleteAdminUser = useDeleteAdminUser();

  const [newRequest, setNewRequest] = useState<CreateChangeRequestInput>({
    title: "",
    problem: "",
    desiredOutcome: "",
    scope: "fullstack",
    urgency: "medium",
    impact: "medium",
    requestedBy: "admin",
    linkedRepo: "cross-repo"
  });
  const [newAdminUser, setNewAdminUser] = useState<CreateAdminUserInput>({
    email: "",
    displayName: "",
    role: "user",
    status: "active",
    twoFactorEnabled: false
  });

  const [transitionNote, setTransitionNote] = useState("");
  const [deleteDialogTarget, setDeleteDialogTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const {
    crGuideDraft,
    crGuideStepIndex,
    crGuideMessages,
    crGuideInput,
    setCrGuideInput,
    crGuideLoading,
    crGuideError,
    applyGuideToForm,
    handleGuideChatSubmit,
  } = useCrGuide(newRequest, setNewRequest);

  const {
    securityPosture,
    deliverability,
    deliverabilityProcedure,
    observability,
    adminDataLoading,
    adminDataError,
    procedureSaving,
    saveProcedureUpdate,
  } = useAdminData(windowRange);

  const {
    assistantPrompt,
    setAssistantPrompt,
    assistantAnswer,
    assistantLoading,
    assistantError,
    adminAssistantSnapshot,
    askHermesForAdminPlan,
  } = useAdminAssistant({
    windowRange,
    severity,
    monitoringSummary,
    monitoringAlerts,
    securityActive,
    monitoringProviders,
    monitoringBounces,
    monitoringLiveEvents: monitoringLive.events,
    securityLiveAlerts: securityLive.alerts,
    observability,
    deliverability,
    deliverabilityProcedure,
    securityPosture,
    adminDataLoading,
    adminDataError,
  });



  const summaryCards = useMemo(() => {
    const summary = monitoringSummary.data;
    const activeMonAlerts = monitoringAlerts.data?.alerts?.length ?? 0;
    const activeSecAlerts = securityActive.data?.alerts?.length ?? 0;

    return [
      {
        label: "Delivery rate",
        value: summary ? percent(summary.delivery_rate) : "—",
        note: "Emails livrés",
        icon: Activity
      },
      {
        label: "Bounce rate",
        value: summary ? percent(summary.bounce_rate) : "—",
        note: "Hard + soft bounce",
        icon: AlertTriangle
      },
      {
        label: "Alertes Monitoring",
        value: asInt(activeMonAlerts),
        note: `Fenêtre ${windowRange}`,
        icon: Clock3
      },
      {
        label: "Alertes Sécurité",
        value: asInt(activeSecAlerts),
        note: severity === "all" ? "Toutes sévérités" : severity,
        icon: ShieldCheck
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
        ok: newRequest.problem.trim().length >= 40
      },
      {
        label: "Impact utilisateur/business explicite",
        ok: /impact|client|utilisateur|business|latence|erreur/i.test(
          `${newRequest.problem} ${crGuideDraft.impact}`
        )
      },
      {
        label: "Critères de succès mesurables",
        ok: /%|ms|slo|sla|kpi|p95|objectif|mesurable|test/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.successCriteria}`
        )
      },
      {
        label: "Plan de rollback / mitigation",
        ok: /rollback|revert|fallback|mitigation/i.test(
          `${newRequest.desiredOutcome} ${crGuideDraft.rollbackPlan}`
        )
      },
      {
        label: "Portée repo + priorité cohérentes",
        ok:
          (newRequest.linkedRepo === "cross-repo" &&
            newRequest.scope === "fullstack") ||
          newRequest.linkedRepo !== "cross-repo"
      },
    ];

    return {
      checks,
      score: checks.filter((c) => c.ok).length
    };
  }, [
    newRequest.problem,
    newRequest.desiredOutcome,
    newRequest.linkedRepo,
    newRequest.scope,
    crGuideDraft.impact,
    crGuideDraft.successCriteria,
    crGuideDraft.rollbackPlan,
  ]);

  const {
    handleCreateChangeRequest,
    handleTransition,
    openDeleteChangeRequestDialog,
    handleDeleteChangeRequestConfirm,
    handleStartImplementation,
    handleUserRoleChange,
    handleUserStatusChange,
    handleCreateUser,
    handleDeleteUser,
  } = useAdminActions({
    newRequest, setNewRequest,
    newAdminUser, setNewAdminUser,
    transitionNote,
    deleteDialogTarget, setDeleteDialogTarget,
    qualityScore: qualityChecks.score,
    createChangeRequest,
    transitionChangeRequest,
    deleteChangeRequest,
    startImplementationChangeRequest,
    updateAdminUser,
    createAdminUser,
    deleteAdminUser,
  });

  const requestsByStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      WORKFLOW_STATUS_COLUMNS.map((status: WorkflowStatus) => [
        status,
        [] as ChangeRequestItem[],
      ])
    ) as Record<WorkflowStatus, ChangeRequestItem[]>;

    for (const item of changeRequests.data?.items ?? []) {
      grouped[item.status].push(item);
    }

    return grouped;
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
          appearsWorkflowOnly
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
      workflowOnlyRunning: runs.filter((run) => run.appearsWorkflowOnly).length
    };
  }, [changeRequests.data?.items]);

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
      workflowRunMonitoring.runs.find((run) => run.runState === "running") ||
      workflowRunMonitoring.runs.find((run) => run.runState === "queued") ||
      workflowRunMonitoring.runs[0];

    setSelectedRunId(preferred.item.id);
  }, [workflowRunMonitoring.runs, selectedRunId]);

  const selectedWorkflowRun = useMemo(() => {
    if (!workflowRunMonitoring.runs.length) return null;
    return (
      workflowRunMonitoring.runs.find((run) => run.item.id === selectedRunId) ||
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

  const changeRequestMonitoring = useMemo(() => {
    const items = changeRequests.data?.items ?? [];
    const nowIso = new Date().toISOString();

    const taken = items.filter((item) => !!item.takenInChargeAt);
    const triageMinutes = taken
      .map((item) => minutesBetween(item.createdAt, item.takenInChargeAt))
      .filter((v): v is number => v !== null);

    const avgTriageMinutes = triageMinutes.length
      ? Math.round(
          triageMinutes.reduce((acc, value) => acc + value, 0) /
            triageMinutes.length
        )
      : null;

    const wip = items.filter(
      (item) => item.status !== "released" && item.status !== "rejected"
    ).length;

    const stalled = items
      .map((item) => ({
        item,
        ageMinutes: minutesBetween(item.updatedAt, nowIso) ?? 0
      }))
      .filter((entry) => entry.item.status !== "released")
      .sort((a, b) => b.ageMinutes - a.ageMinutes)
      .slice(0, 3);

    const latestEvents = items
      .flatMap((item) =>
        (item.workflowEvents ?? []).map((event) => ({
          ...event,
          requestId: item.id,
          requestTitle: item.title
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
      latestEvents
    };
  }, [changeRequests.data?.items]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
      <header className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[#F4F4F5]">
              Console Admin
            </h1>
            <p className="text-sm text-[#A1A1AA]">
              Monitoring SMTP, sécurité anti-phishing, incidents, change
              requests.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setWindowRange(opt)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs",
                  windowRange === opt
                    ? "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7]"
                    : "border-[#2B2B31] bg-[#151518] text-[#B4B4BB] hover:border-[#3A3A42]"
                )}
              >
                {opt}
              </button>
            ))}
            <select
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as SecuritySeverity | "all")
              }
              className="rounded-lg border border-[#2B2B31] bg-[#151518] px-2.5 py-1 text-xs text-[#D4D4D8]"
              aria-label="Filtrer la sévérité sécurité"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  severity: {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["overview", "Vue globale"],
              ["monitoring", "Monitoring SMTP"],
              ["security", "Sécurité"],
              ["deliverability-ops", "Deliverability Ops"],
              ["changelog", "Changelog"],
              ["change-requests", "Change requests"],
              ["users", "Utilisateurs"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium",
                activeTab === key
                  ? "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7]"
                  : "border-[#2B2B31] bg-[#151518] text-[#B4B4BB] hover:border-[#3A3A42]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {(activeTab === "overview" ||
        activeTab === "monitoring" ||
        activeTab === "security") && (
        <AdminOverviewSections
          activeTab={activeTab as "overview" | "monitoring" | "security"}
          observability={observability as unknown as LocalObservabilityOverview}
          securityPosture={securityPosture}
          deliverability={deliverability}
          adminDataLoading={adminDataLoading}
          adminDataError={adminDataError}
          securityLive={securityLive}
          monitoringLive={monitoringLive}
          assistantLoading={assistantLoading}
          assistantPrompt={assistantPrompt}
          setAssistantPrompt={setAssistantPrompt}
          assistantAnswer={assistantAnswer}
          assistantError={assistantError}
          askHermesForAdminPlan={askHermesForAdminPlan}
          summaryCards={summaryCards}
          monitoringProviders={monitoringProviders.data?.providers ?? []}
          monitoringBounces={monitoringBounces.data?.bounces ?? []}
          securityActiveAlerts={securityActive.data?.alerts ?? []}
          securityIncidents={securityIncidents.data?.alerts ?? []}
        />
      )}
      {activeTab === "deliverability-ops" && (
        <DeliverabilityOpsTab
          procedureSaving={procedureSaving}
          deliverabilityProcedure={deliverabilityProcedure}
          deliverability={deliverability}
          saveProcedureUpdate={saveProcedureUpdate}
        />
      )}
      {activeTab === "change-requests" && (
        <ChangeRequestsTab
          changeRequests={changeRequests}
          changeRequestMonitoring={changeRequestMonitoring}
          workflowRunMonitoring={workflowRunMonitoring}
          selectedWorkflowRun={selectedWorkflowRun}
          selectedWorkflowRunEvents={selectedWorkflowRunEvents}
          requestsByStatus={requestsByStatus}
          newRequest={newRequest}
          setNewRequest={setNewRequest}
          transitionNote={transitionNote}
          setTransitionNote={setTransitionNote}
          deleteDialogTarget={deleteDialogTarget}
          setDeleteDialogTarget={setDeleteDialogTarget}
          selectedRunId={selectedRunId}
          setSelectedRunId={setSelectedRunId}
          observability={observability}
          qualityChecks={qualityChecks}
          adminDataLoading={adminDataLoading}
          adminDataError={adminDataError}
          crGuideMessages={crGuideMessages}
          crGuideInput={crGuideInput}
          crGuideLoading={crGuideLoading}
          crGuideError={crGuideError}
          createChangeRequest={createChangeRequest}
          deleteChangeRequest={deleteChangeRequest}
          transitionChangeRequest={transitionChangeRequest}
          startImplementationChangeRequest={startImplementationChangeRequest}
          handleCreateChangeRequest={handleCreateChangeRequest}
          handleTransition={handleTransition}
          handleStartImplementation={handleStartImplementation}
          handleDeleteChangeRequestConfirm={handleDeleteChangeRequestConfirm}
          openDeleteChangeRequestDialog={openDeleteChangeRequestDialog}
          handleGuideChatSubmit={handleGuideChatSubmit}
          applyGuideToForm={applyGuideToForm}
          setCrGuideInput={setCrGuideInput}
        />
      )}


      {activeTab === "users" && (
        <UsersTab
          adminUsers={adminUsers}
          adminWhoami={whoami}
          adminAiActivity={adminAiActivity}
          adminAuditLog={adminAuditLog}
          createAdminUser={createAdminUser}
          inviteAdminUser={inviteAdminUser}
          resetAdminPassword={resetAdminPassword}
          deleteAdminUser={deleteAdminUser}
          updateAdminUser={updateAdminUser}
        />
      )}
    </div>
  );
}
