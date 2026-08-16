"use client";

import { useState } from "react";
import {
  useMonitoringAlerts,
  useMonitoringBounces,
  useMonitoringLive,
  useMonitoringProviders,
  useMonitoringSummary,
} from "@/hooks/use-monitoring";
import {
  useSecurityActiveAlerts,
  useSecurityIncidents,
  useSecurityLive,
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
  useUpdateAdminUser,
} from "@/hooks/use-admin-ops";
import type {
  CreateAdminUserInput,
  CreateChangeRequestInput,
} from "@/types/admin-ops";
import { ChangelogTab } from "./tabs/ChangelogTab";
import { ChangeRequestsTab } from "./tabs/ChangeRequestsTab";
import { DeliverabilityOpsTab } from "./tabs/DeliverabilityOpsTab";
import {
  AdminOverviewSections,
  type LocalObservabilityOverview,
} from "./tabs/AdminOverviewSections";
import { UsersTab } from "./tabs/UsersTab";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import { cn } from "@/lib/utils";
import {
  type AdminTab,
  WINDOW_OPTIONS,
  SEVERITY_OPTIONS,
} from "./admin-console-constants";
import { useAdminData } from "@/hooks/useAdminData";
import { useCrGuide } from "@/hooks/useCrGuide";
import { useAdminAssistant } from "@/hooks/useAdminAssistant";
import { useAdminActions } from "@/hooks/useAdminActions";
import { useAdminConsoleDerived } from "./hooks/useAdminConsoleDerived";

export function AdminConsolePage({
  initialTab = "overview",
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
    enabled: activeTab !== "changelog",
  });

  const securitySeverityFilter = severity === "all" ? undefined : severity;
  const securityActive = useSecurityActiveAlerts({
    window: windowRange,
    severity: securitySeverityFilter,
  });
  const securityIncidents = useSecurityIncidents({
    page: 1,
    page_size: 20,
    severity: securitySeverityFilter,
  });
  const securityLive = useSecurityLive({ enabled: activeTab !== "changelog" });

  const adminChangelog = useAdminChangelog();
  const changeRequests = useChangeRequests();
  const adminUsers = useAdminUsers();
  const whoami = useAdminWhoami();
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
    linkedRepo: "cross-repo",
  });
  const [newAdminUser, setNewAdminUser] = useState<CreateAdminUserInput>({
    email: "",
    displayName: "",
    role: "user",
    status: "active",
    twoFactorEnabled: false,
  });

  const [transitionNote, setTransitionNote] = useState("");
  const [deleteDialogTarget, setDeleteDialogTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const {
    crGuideDraft,
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

  const {
    selectedRunId,
    setSelectedRunId,
    summaryCards,
    qualityChecks,
    requestsByStatus,
    workflowRunMonitoring,
    selectedWorkflowRun,
    selectedWorkflowRunEvents,
    changeRequestMonitoring,
  } = useAdminConsoleDerived({
    windowRange,
    severity,
    monitoringSummary,
    monitoringAlerts,
    securityActive,
    changeRequests,
    newRequest,
    crGuideDraft,
  });

  const {
    handleCreateChangeRequest,
    handleTransition,
    openDeleteChangeRequestDialog,
    handleDeleteChangeRequestConfirm,
    handleStartImplementation,
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
