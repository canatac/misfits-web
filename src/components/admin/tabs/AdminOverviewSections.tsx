"use client";
import React from "react";
import type { SecurityAlert } from "@/types/security";
import type { MonitoringProvider, SmtpEvent } from "@/types/monitoring";
import type {
  ActiveTabScope,
  SummaryCard,
  LocalSecurityPosture,
  LocalDeliverabilityDiag,
  LocalObservabilityOverview,
  MonitoringLive,
  SecurityLive,
} from "./overview-sections/types";
import { AssistantSection } from "./overview-sections/AssistantSection";
import { SummaryCardsSection } from "./overview-sections/SummaryCardsSection";
import { DiagnosticsGridSection } from "./overview-sections/DiagnosticsGridSection";
import { ProvidersBouncesSection } from "./overview-sections/ProvidersBouncesSection";
import { AlertsIncidentsSection } from "./overview-sections/AlertsIncidentsSection";
import { MonitoringLiveStreamSection } from "./overview-sections/MonitoringLiveStreamSection";
import { SecurityLiveStreamSection } from "./overview-sections/SecurityLiveStreamSection";

// Re-exports pour maintenir la compat des call-sites externes
export type { LocalSecurityPosture, LocalObservabilityOverview };

interface AdminOverviewSectionsProps {
  activeTab: ActiveTabScope;
  observability: LocalObservabilityOverview | null;
  securityPosture: LocalSecurityPosture | null;
  deliverability: LocalDeliverabilityDiag | null;
  adminDataLoading: boolean;
  adminDataError: string | null;
  securityLive: SecurityLive;
  monitoringLive?: MonitoringLive;
  assistantLoading: boolean;
  assistantPrompt: string;
  setAssistantPrompt: (v: string) => void;
  assistantAnswer: string;
  assistantError: string | null;
  askHermesForAdminPlan: () => void;
  summaryCards: readonly SummaryCard[];
  monitoringProviders?: MonitoringProvider[];
  monitoringBounces?: SmtpEvent[];
  securityActiveAlerts?: SecurityAlert[];
  securityIncidents?: SecurityAlert[];
}

export function AdminOverviewSections({
  activeTab,
  observability,
  securityPosture,
  deliverability,
  adminDataLoading,
  adminDataError,
  securityLive,
  monitoringLive,
  assistantLoading,
  assistantPrompt,
  setAssistantPrompt,
  assistantAnswer,
  assistantError,
  askHermesForAdminPlan,
  summaryCards,
  monitoringProviders = [],
  monitoringBounces = [],
  securityActiveAlerts = [],
  securityIncidents = [],
}: AdminOverviewSectionsProps) {
  return (
    <>
      <AssistantSection activeTab={activeTab} assistantLoading={assistantLoading} assistantPrompt={assistantPrompt} setAssistantPrompt={setAssistantPrompt} assistantAnswer={assistantAnswer} assistantError={assistantError} askHermesForAdminPlan={askHermesForAdminPlan} />
      <SummaryCardsSection activeTab={activeTab} summaryCards={summaryCards} />
      <DiagnosticsGridSection activeTab={activeTab} securityPosture={securityPosture} deliverability={deliverability} observability={observability} />
      <ProvidersBouncesSection activeTab={activeTab} monitoringProviders={monitoringProviders} monitoringBounces={monitoringBounces} />
      <AlertsIncidentsSection activeTab={activeTab} securityActiveAlerts={securityActiveAlerts} securityIncidents={securityIncidents} />
      <MonitoringLiveStreamSection activeTab={activeTab} monitoringLive={monitoringLive} />
      <SecurityLiveStreamSection activeTab={activeTab} securityLive={securityLive} />
      {adminDataLoading && (
        <p className="text-xs text-[#A1A1AA]">
          Chargement des données admin backend…
        </p>
      )}
      {adminDataError && (
        <p className="text-xs text-[#FCA5A5]">
          Erreur backend admin: {adminDataError}
        </p>
      )}
    </>
  );
}
