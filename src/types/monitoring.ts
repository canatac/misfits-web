export type MonitoringWindow = "5m" | "15m" | "1h" | "24h";

export type SmtpEventType =
  | "accepted"
  | "dns_lookup"
  | "mx_selected"
  | "smtp_connect"
  | "tls_ok"
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
  total_ms?: number;
  smtp_code?: number;
  smtp_reply?: string;
  status: DeliveryStatus;
  bounce_type?: "hard" | "soft" | "policy";
  bounce_reason?: string;
  risk_score?: number;
}

export interface MonitoringSummary {
  total_events: number;
  by_status: Record<string, number>;
  delivery_rate: number;
  bounce_rate: number;
  avg_total_ms: number;
  p95_total_ms: number;
  avg_risk_score: number;
}

export interface MonitoringEventsResponse {
  events: SmtpEvent[];
  total: number;
  has_more: boolean;
}

export interface MonitoringTrace {
  message_id: string;
  status: DeliveryStatus;
  total_ms?: number;
  trace: SmtpEvent[];
}

export interface MonitoringBouncesResponse {
  total: number;
  hard: number;
  soft: number;
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
  severity: "critical" | "warning" | string;
  message: string;
  value: number;
  threshold: number;
  ts: string;
}

export interface MonitoringAlertsResponse {
  alerts: MonitoringAlert[];
}

export interface MonitoringEventFilters {
  status?: string;
  country?: string;
  provider?: string;
  message_id?: string;
  page?: number;
  page_size?: number;
}