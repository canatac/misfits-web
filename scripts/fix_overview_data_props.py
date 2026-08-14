#!/usr/bin/env python3
"""
Fix AdminOverviewSections: add missing props + extend types for observability
"""
path = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
content = open(path).read()

# 1. Extend LocalObservabilityOverview with missing fields
old_obs = """type LocalObservabilityOverview = {
  smtp?: { total_events?: number; failure_events?: number; p95_total_ms?: number };
  health_realtime?: {
    queue?: { depth?: number; oldest_age_seconds?: number | null };
    throughput?: { incoming_per_min?: number; outgoing_per_min?: number };
    delivery?: { success_rate?: number; smtp_4xx_rate?: number; smtp_5xx_rate?: number; p95_total_ms?: number };
  };
};"""
new_obs = """type LocalObservabilityOverview = {
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
  };
  security_deliverability?: {
    spf_failures_24h?: number;
    dkim_failures_24h?: number;
    dmarc_failures_24h?: number;
    auth_ratio?: number;
  };
  exports?: {
    last_export_at?: string | null;
    total_exports?: number;
  };
};"""
content = content.replace(old_obs, new_obs)

# 2. Add monitoringProviders, monitoringBounces, securityActive, securityIncidents to props
old_interface_end = """  summaryCards: readonly SummaryCard[];
}"""
new_interface_end = """  summaryCards: readonly SummaryCard[];
  monitoringProviders: { data?: { providers?: Array<Record<string, unknown>> } };
  monitoringBounces: { data?: { bounces?: Array<Record<string, unknown>> } };
  securityActive: { data?: { alerts?: Array<Record<string, unknown>> } };
  securityIncidents: { data?: { incidents?: Array<Record<string, unknown>> } };
}"""
content = content.replace(old_interface_end, new_interface_end)

# 3. Add to destructuring
old_dest_end = """  summaryCards,
}: AdminOverviewSectionsProps) {"""
new_dest_end = """  summaryCards,
  monitoringProviders,
  monitoringBounces,
  securityActive,
  securityIncidents,
}: AdminOverviewSectionsProps) {"""
content = content.replace(old_dest_end, new_dest_end)

# 4. Fix implicit any on map callbacks for providers/bounces/securityActive
content = content.replace(
    ".map((provider,",
    ".map((provider: Record<string, unknown>,"
)
content = content.replace(
    ".map((bounce,",
    ".map((bounce: Record<string, unknown>,"
)
content = content.replace(
    "securityActive.data?.alerts?.slice(0,",
    "(securityActive.data?.alerts ?? []).slice(0,"
)

open(path, "w").write(content)
print(f"AdminOverviewSections.tsx: {len(content.splitlines())} lines")

# 5. Update parent call site to pass new props
parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
pc = open(parent).read()
pc = pc.replace(
    "          summaryCards={summaryCards}\n        />",
    """          summaryCards={summaryCards}
          monitoringProviders={monitoringProviders}
          monitoringBounces={monitoringBounces}
          securityActive={securityActive}
          securityIncidents={securityIncidents}
        />"""
)
open(parent, "w").write(pc)
print(f"admin-console-page.tsx: {len(pc.splitlines())} lines")
