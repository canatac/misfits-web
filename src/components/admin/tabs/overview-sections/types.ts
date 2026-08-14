import type { SecurityAlert } from "@/types/security";
import type { MonitoringProvider, SmtpEvent } from "@/types/monitoring";
import type React from "react";

export type ActiveTabScope = "overview" | "monitoring" | "security";

export interface SummaryCard {
  label: string;
  value: string | number;
  note: string;
  icon: React.ElementType;
}

export type LocalSecurityPosture = {
  threat_events?: number;
  auth_failures_total?: number;
  suspicious_ips_count?: number;
  blocked_events?: number;
  alerts?: Array<{ id: string; severity: string; title: string; description: string; at: string; remediation?: string }>;
  ip_reputation?: Array<{ ip: string; risk_score: number; is_blocked: boolean; last_seen_at: string }>;
  security?: {
    tls?: { smtp_starttls_required?: boolean; smtps_listener?: string; imaps_listener?: string };
    authentication?: { sasl_mechanisms?: string[]; oauth2_enabled?: boolean; admin_mfa_required?: boolean };
    anti_abuse?: { rate_limit_enabled?: boolean; rate_limit_per_minute?: number; fail2ban_enabled?: boolean; bruteforce_signals_24h?: number; auth_policy_signals_24h?: number };
    mail_auth_dns?: { domain?: string; spf_expected?: string; dkim_selector?: string; dmarc_expected?: string; ptr_rdns_note?: string };
  };
};

export type LocalDeliverabilityDiag = {
  total_events?: number;
  bounces_total?: number;
  auth_policy_alerts?: number;
  spf?: { failures?: number; failure_rate?: number };
  dkim?: { failures?: number; failure_rate?: number };
  dmarc?: { failures?: number; failure_rate?: number };
  reputation?: { avg_risk_score?: number; high_risk_events?: number; ip_domain_status?: string };
  top_bounce_reasons?: Array<{ reason: string; count: number }>;
  rbl?: { sources?: string[]; listed_by?: string[]; status?: string };
};

export type LocalObservabilityOverview = {
  smtp?: { total_events?: number; failure_events?: number; p95_total_ms?: number };
  health_realtime?: {
    queue?: { depth?: number; oldest_age_seconds?: number | null };
    throughput?: { incoming_per_min?: number; outgoing_per_min?: number };
    delivery?: { success_rate?: number; smtp_4xx_rate?: number; smtp_5xx_rate?: number; p95_total_ms?: number };
  };
  proactive_alerting?: {
    enabled?: boolean;
    active_rules?: number;
    last_triggered?: string | null;
    active_alerts?: Array<{ id: string; severity: string; message: string; ts: string }>;
    threshold_alerts?: { queue_growth?: number; auth_failures?: number; imap_latency_alert?: boolean };
    correlation?: { enabled?: boolean; window_minutes?: number; matched?: number; dns?: { lookup_issue_events?: number }; blacklist?: { listed_by?: string[] } };
  };
  security_deliverability?: {
    spf_failures_24h?: number;
    dkim_failures_24h?: number;
    dmarc_failures_24h?: number;
    auth_ratio?: number;
    suspicious_logins_top?: Array<{ ip: string; attempts: number }>;
  };
  exports?: { last_export_at?: string | null; total_exports?: number; prometheus_enabled?: boolean; siem_webhook_configured?: boolean };
};

export type MonitoringLiveEvent = { id?: string; kind?: string; event_type?: string; ts?: string; message?: string; level?: string; to?: string };

export interface MonitoringLive {
  isConnected?: boolean;
  events?: MonitoringLiveEvent[];
}

export interface SecurityLive {
  isConnected: boolean;
  alerts: SecurityAlert[];
}

export type { SecurityAlert, MonitoringProvider, SmtpEvent };
