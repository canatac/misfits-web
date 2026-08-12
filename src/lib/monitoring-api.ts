import { apiClient } from "@/lib/api-client";
import type {
  MonitoringAlertsResponse,
  MonitoringBouncesResponse,
  MonitoringEventFilters,
  MonitoringEventsResponse,
  MonitoringProvidersResponse,
  MonitoringSummary,
  MonitoringTrace,
  MonitoringWindow,
} from "@/types/monitoring";

function withParams(
  path: string,
  params: Record<string, string | number | undefined>
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `${path}?${q}` : path;
}

export function getMonitoringSummary(window: MonitoringWindow) {
  return apiClient.get<MonitoringSummary>(
    withParams("/monitoring/summary", { window })
  );
}

export function getMonitoringEvents(filters: MonitoringEventFilters) {
  return apiClient.get<MonitoringEventsResponse>(
    withParams("/monitoring/events", {
      status: filters.status,
      from: filters.from,
      to: filters.to,
      country: filters.country,
      provider: filters.provider,
      since: filters.since,
      until: filters.until,
      message_id: filters.message_id,
      page: filters.page,
      page_size: filters.page_size ?? 50,
    })
  );
}

export function getMonitoringTrace(messageId: string) {
  return apiClient.get<MonitoringTrace>(
    `/monitoring/messages/${encodeURIComponent(messageId)}/trace`
  );
}

export function getMonitoringBounces(window: MonitoringWindow) {
  return apiClient.get<MonitoringBouncesResponse>(
    withParams("/monitoring/bounces", { window })
  );
}

export function getMonitoringTopProviders(window: MonitoringWindow) {
  return apiClient.get<MonitoringProvidersResponse>(
    withParams("/monitoring/providers/top", { window })
  );
}

export function getMonitoringActiveAlerts(window: MonitoringWindow) {
  return apiClient.get<MonitoringAlertsResponse>(
    withParams("/monitoring/alerts/active", { window })
  );
}
