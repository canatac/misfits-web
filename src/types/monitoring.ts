export type MonitoringWindow = "15m" | "1h" | "6h" | "24h" | "7d";

export type SmtpEventType =
  | "accepted"
  | "queued"
  | "dns_lookup"
  | "mx_selected"
  | "smtp_connect"
  | "tls_ok"
  | "smtp_response"
  | "delivered"
  | "deferred"
  | "bounced";

export type DeliveryStatus =
  | "pending"
  | "delivered"
  | "deferred"
  | "bounced"
  | "failed";

export interface SmtpEvent {
  id: string;
  ts: string;
  message_id: string;
  correlation_id: string;
  tenant_id?: string;
  event_type: SmtpEventType;
  from: string;
  to: string;
  mx_host?: string;
  remote_ip?: string;
  remote_port?: number;
  country?: string;
  city?: string;
  asn?: string;
  company?: string;
  datacenter?: string;
  dns_ms?: number;
  connect_ms?: number;
  tls_ms?: number;
  queue_ms?: number | null;
  total_ms?: number;
  smtp_code?: number;
  smtp_reply?: string;
  attempt?: number;
  status: DeliveryStatus;
  bounce_type?: "hard" | "soft" | "policy";
  bounce_reason?: string;
  risk_score?: number;
}

export interface MonitoringSummary {
  window?: MonitoringWindow;
  since?: string;
  total_events: number;
  by_status: Record<string, number>;
  delivery_rate: number;
  bounce_rate: number;
  avg_total_ms: number;
  p95_total_ms: number | null;
  avg_risk_score: number;
}

export interface MonitoringEventsResponse {
  events: SmtpEvent[];
  total: number;
  page?: number;
  page_size?: number;
  has_more: boolean;
}

export interface MonitoringTrace {
  message_id: string;
  status: DeliveryStatus | string;
  total_ms?: number;
  steps?: number;
  trace: SmtpEvent[];
}

export interface MonitoringBouncesResponse {
  window?: MonitoringWindow;
  total: number;
  hard: number;
  soft: number;
  policy?: number;
  bounces: SmtpEvent[];
}

export interface MonitoringProvider {
  company?: string;
  datacenter?: string;
  country?: string;
  count: number;
  delivered: number;
  bounced: number;
  avg_total_ms: number;
  avg_risk_score: number;
}

export interface MonitoringProvidersResponse {
  providers: MonitoringProvider[];
}

export interface MonitoringAlert {
  kind: string;
  severity: "low" | "medium" | "high" | "critical" | string;
  message: string;
  value: number;
  threshold: number;
  ts: string;
}

export interface MonitoringAlertsResponse {
  window?: MonitoringWindow;
  alert_count?: number;
  alerts: MonitoringAlert[];
}

export interface MonitoringEventFilters {
  status?: string;
  from?: string;
  to?: string;
  country?: string;
  provider?: string;
  since?: string;
  until?: string;
  message_id?: string;
  page?: number;
  page_size?: number;
}