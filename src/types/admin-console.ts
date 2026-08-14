// admin-console.ts — shared admin console API response types (Sprint 6)

export type AdminDeliverabilityDiagnosticsResponse = {
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

export type DeliverabilityProcedureData = {
  overall_status?: string;
  domain?: string;
  window?: string;
  progress?: { done?: number; total?: number };
  reminder?: { enabled?: boolean; cadence_hours?: number; next_due_at?: string };
  checklist?: Array<{
    id: string;
    title: string;
    status: "done" | "done_manual" | "in_progress" | "todo" | "blocked";
    evidence?: string;
    operator_note?: string;
    cta?: { label?: string; kind?: string; details?: string };
  }>;
  cta_details?: Array<{ id: string; label: string; description: string }>;
  automation?: { auto_checks?: string[]; last_computed_at?: string };
};

export type AdminObservabilityOverviewResponse = {
  smtp?: {
    total_events?: number;
    failure_events?: number;
    p95_total_ms?: number;
  };
  health_realtime?: {
    queue?: {
      depth?: number;
      oldest_age_seconds?: number | null;
    };
    throughput?: {
      incoming_per_min?: number;
      outgoing_per_min?: number;
    };
    delivery?: {
      success_rate?: number;
      smtp_4xx_rate?: number;
      smtp_5xx_rate?: number;
      p95_total_ms?: number;
    };
  };
  proactive_alerting?: {
    threshold_alerts?: {
      queue_growth?: number;
      auth_failures?: number;
      imap_latency_alert?: boolean;
    };
    anomaly_detection?: {
      anomaly_alerts?: number;
      spam_or_volume_spike?: boolean;
      sudden_bounce_signal?: boolean;
    };
    correlation?: {
      smtp?: { events?: number; smtp_4xx?: number; smtp_5xx?: number };
      imap?: { active_connections?: number | null; p95_ms?: number | null };
      dns?: { lookup_issue_events?: number };
      blacklist?: {
        sources?: string[];
        listed_by?: string[];
        listed?: boolean;
      };
    };
  };
  security_deliverability?: {
    suspicious_logins_top?: Array<{ ip?: string; attempts?: number }>;
    active_security_alerts?: number;
    active_monitoring_alerts?: number;
  };
  imap?: {
    active_connections?: number | null;
  };
  realtime_alerts?: {
    monitoring_active?: number;
    security_active?: number;
  };
  exports?: {
    prometheus_enabled?: boolean;
    siem_webhook_configured?: boolean;
  };
  per_domain?: Array<{
    domain: string;
    count: number;
    delivered: number;
    bounced: number;
  }>;
};
