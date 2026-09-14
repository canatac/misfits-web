/**
 * Email authentication monitoring API client.
 *
 * Integrates frontend with backend deliverability monitoring endpoints.
 * Consumes AdminDeliverabilityDiagnosticsResponse and provides
 * real-time auth status tracking for DKIM/SPF/DMARC.
 */
import { apiClient } from "@/lib/api-client";
import type { AdminDeliverabilityDiagnosticsResponse } from "@/types/admin-ops-deliverability";

/**
 * Fetch deliverability diagnostics for a given time window.
 */
export function getDeliverabilityDiagnostics(window: string = "24h") {
  return apiClient.get<AdminDeliverabilityDiagnosticsResponse>(
    `/admin/deliverability/diagnostics?window=${encodeURIComponent(window)}`
  );
}

/**
 * Fetch email authentication incident history.
 */
export function getAuthIncidents(params: {
  window?: string;
  page?: number;
  page_size?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.window) search.set("window", params.window);
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  const q = search.toString();
  return apiClient.get<{
    incidents: AuthIncident[];
    total: number;
    page: number;
    page_size: number;
  }>(`/admin/deliverability/incidents${q ? `?${q}` : ""}`);
}

export interface AuthIncident {
  id: string;
  ts: string;
  type: "spf" | "dkim" | "dmarc" | "mx";
  status: "pass" | "fail" | "none" | "unknown";
  message: string;
  resolved: boolean;
  resolved_at?: string | null;
}

/**
 * Acknowledge an auth incident.
 */
export function acknowledgeIncident(incidentId: string) {
  return apiClient.post<{ success: boolean; incident_id: string }>(
    `/admin/deliverability/incidents/${encodeURIComponent(incidentId)}/acknowledge`
  );
}

/**
 * Trigger a manual auth check refresh.
 */
export function refreshAuthChecks() {
  return apiClient.post<{ success: boolean; message: string }>(
    `/admin/deliverability/refresh`
  );
}
