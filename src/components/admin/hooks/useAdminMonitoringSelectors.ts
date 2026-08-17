"use client";

/**
 * useAdminMonitoringSelectors — bundles monitoring + security dashboard
 * queries used by the admin console page so the page component stays lean.
 */
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
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";

interface Args {
  windowRange: MonitoringWindow;
  severity: SecuritySeverity | "all";
  activeTab: string;
}

export function useAdminMonitoringSelectors({
  windowRange,
  severity,
  activeTab,
}: Args) {
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
  return {
    monitoringSummary,
    monitoringAlerts,
    monitoringProviders,
    monitoringBounces,
    monitoringLive,
    securityActive,
    securityIncidents,
    securityLive,
  };
}
