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
import type {
  CreateAdminUserInput,
  CreateChangeRequestInput,
} from "@/types/admin-ops";
import { ChangeRequestsTab } from "./tabs/ChangeRequestsTab";
import { DeliverabilityOpsTab } from "./tabs/DeliverabilityOpsTab";
import {
  AdminOverviewSections,
  type LocalObservabilityOverview,
} from "./tabs/AdminOverviewSections";
import { UsersTab } from "./tabs/UsersTab";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";
import { type AdminTab } from "./admin-console-constants";
import { useAdminData } from "@/hooks/useAdminData";
import { useCrGuide } from "@/hooks/useCrGuide";
import { useAdminAssistant } from "@/hooks/useAdminAssistant";
import { useAdminActions } from "@/hooks/useAdminActions";
import { useAdminConsoleDerived } from "./hooks/useAdminConsoleDerived";
import { useAdminMutations } from "./hooks/useAdminMutations";
import { AdminConsoleHeader } from "./parts/AdminConsoleHeader";

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

  const {
    changeRequests,
    adminUsers,
    whoami,
    inviteAdminUser,
    resetAdminPassword,
    adminAuditLog,
    adminAiActivity,
    createChangeRequest,
    transitionChangeRequest,
    deleteChangeRequest,
    startImplementationChangeRequest,
    updateAdminUser,
    createAdminUser,
    deleteAdminUser,
  } = useAdminMutations();

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
      <AdminConsoleHeader
        windowRange={windowRange}
        setWindowRange={setWindowRange}
        severity={severity}
        setSeverity={setSeverity}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

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
