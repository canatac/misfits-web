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
  const monitoringEnabled =
    activeTab === "overview" ||
    activeTab === "monitoring" ||
    activeTab === "security" ||
    activeTab === "change-requests";

  const securityEnabled =
    activeTab === "overview" ||
    activeTab === "security" ||
    activeTab === "monitoring" ||
    activeTab === "change-requests";

  const monitoringSummary = useMonitoringSummary(windowRange, {
    enabled: monitoringEnabled,
  });
  const monitoringAlerts = useMonitoringAlerts(windowRange, {
    enabled: monitoringEnabled,
  });
  const monitoringProviders = useMonitoringProviders(windowRange, {
    enabled: monitoringEnabled,
  });
  const monitoringBounces = useMonitoringBounces(windowRange, {
    enabled: monitoringEnabled,
  });
  const monitoringLive = useMonitoringLive({
    enabled: monitoringEnabled,
  });
  const securitySeverityFilter = severity === "all" ? undefined : severity;
  const securityActive = useSecurityActiveAlerts({
    window: windowRange,
    severity: securitySeverityFilter,
  }, { enabled: securityEnabled });
  const securityIncidents = useSecurityIncidents({
    page: 1,
    page_size: 20,
    severity: securitySeverityFilter,
  }, { enabled: securityEnabled });
  const securityLive = useSecurityLive({ enabled: securityEnabled });
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
