import { apiClient } from "@/lib/api-client";
import type {
  RollbackResponse,
  SecurityAlertsResponse,
  SecurityIncidentsResponse,
  SecuritySeverity,
  TenantStatusResponse,
} from "@/types/security";

function withParams(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `${path}?${q}` : path;
}

export interface SecurityAlertsFilters {
  window?: string;
  severity?: SecuritySeverity;
  tenant_id?: string;
}

export interface SecurityIncidentsFilters {
  page?: number;
  page_size?: number;
  tenant_id?: string;
  severity?: SecuritySeverity;
}

export function getSecurityActiveAlerts(filters: SecurityAlertsFilters) {
  return apiClient.get<SecurityAlertsResponse>(
    withParams("/security/alerts/active", {
      window: filters.window,
      severity: filters.severity,
      tenant_id: filters.tenant_id,
    }),
  );
}

export function getSecurityIncidents(filters: SecurityIncidentsFilters) {
  return apiClient.get<SecurityIncidentsResponse>(
    withParams("/security/incidents", {
      page: filters.page ?? 1,
      page_size: filters.page_size ?? 20,
      tenant_id: filters.tenant_id,
      severity: filters.severity,
    }),
  );
}

export function getSecurityTenantStatus(tenantId: string) {
  return apiClient.get<TenantStatusResponse>(
    `/security/tenant/${encodeURIComponent(tenantId)}/status`,
  );
}

export function rollbackSecurityRemediation(alertId: string) {
  return apiClient.post<RollbackResponse>(
    `/security/remediation/${encodeURIComponent(alertId)}/rollback`,
  );
}
