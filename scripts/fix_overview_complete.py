#!/usr/bin/env python3
"""
Complete fix for AdminOverviewSections:
1. Use proper types from @/types/monitoring and @/types/security
2. Pass data arrays directly (not UseQueryResult objects) to avoid complex generics
3. Extend LocalObservabilityOverview with all missing fields
"""
path = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
content = open(path).read()

# ── 1. Replace import section header ──
old_header = '''"use client";
import React from "react";
// AdminOverviewSections.tsx — extracted Sprint 3
// Shared diagnostic sections for overview / monitoring / security tabs
import type { SecurityAlert } from "@/types/security";
import { cn } from "@/lib/utils";
import { Badge, asDate, asInt, percent } from "../shared";'''

new_header = '''"use client";
import React from "react";
// AdminOverviewSections.tsx — extracted Sprint 3
// Shared diagnostic sections for overview / monitoring / security tabs
import type { SecurityAlert } from "@/types/security";
import type { MonitoringAlert } from "@/types/monitoring";
import { cn } from "@/lib/utils";
import { Badge, asDate, asInt, percent } from "../shared";'''
content = content.replace(old_header, new_header)

# ── 2. Extend LocalObservabilityOverview ──
old_obs = """type LocalObservabilityOverview = {
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
    threshold_alerts?: number;
    correlation?: { enabled?: boolean; window_minutes?: number; matched?: number };
  };
  security_deliverability?: {
    spf_failures_24h?: number;
    dkim_failures_24h?: number;
    dmarc_failures_24h?: number;
    auth_ratio?: number;
    suspicious_logins_top?: Array<{ ip: string; attempts: number }>;
  };
  exports?: {
    last_export_at?: string | null;
    total_exports?: number;
    prometheus_enabled?: boolean;
    siem_webhook_configured?: boolean;
  };
};"""
content = content.replace(old_obs, new_obs)

# ── 3. Replace complex UseQueryResult props with simple typed data arrays ──
old_query_props = """  monitoringProviders: { data?: { providers?: Array<Record<string, unknown>> } };
  monitoringBounces: { data?: { bounces?: Array<Record<string, unknown>> } };
  securityActive: { data?: { alerts?: Array<Record<string, unknown>> } };
  securityIncidents: { data?: { incidents?: Array<Record<string, unknown>> } };"""

new_query_props = """  monitoringProviders?: Array<{ name?: string; status?: string; latency_ms?: number; success_rate?: number; region?: string }>;
  monitoringBounces?: Array<{ email?: string; reason?: string; at?: string; code?: number }>;
  securityActiveAlerts?: SecurityAlert[];
  securityIncidents?: Array<{ id?: string; severity?: string; title?: string; at?: string; status?: string }>;"""
content = content.replace(old_query_props, new_query_props)

# ── 4. Update destructuring ──
old_dest2 = """  monitoringProviders,
  monitoringBounces,
  securityActive,
  securityIncidents,"""
new_dest2 = """  monitoringProviders = [],
  monitoringBounces = [],
  securityActiveAlerts = [],
  securityIncidents = [],"""
content = content.replace(old_dest2, new_dest2)

# ── 5. Fix usages of old names in JSX ──
import re
# monitoringProviders.data?.providers -> monitoringProviders
content = re.sub(r'monitoringProviders\.data\?\.\s*providers\s*\?\??\s*\[\]', 'monitoringProviders', content)
content = re.sub(r'monitoringProviders\.data\?\.\s*providers', 'monitoringProviders', content)
content = re.sub(r'monitoringBounces\.data\?\.\s*bounces\s*\?\??\s*\[\]', 'monitoringBounces', content)
content = re.sub(r'monitoringBounces\.data\?\.\s*bounces', 'monitoringBounces', content)
content = re.sub(r'\(securityActive\.data\?\.\s*alerts\s*\?\?\s*\[\]\)', '(securityActiveAlerts)', content)
content = re.sub(r'securityActive\.data\?\.\s*alerts\b', 'securityActiveAlerts', content)
content = re.sub(r'securityIncidents\.data\?\.\s*incidents\s*\?\??\s*\[\]', 'securityIncidents', content)
content = re.sub(r'securityIncidents\.data\?\.\s*incidents', 'securityIncidents', content)

# Fix Record<string,unknown> map callbacks → typed
content = content.replace(
    ".map((provider: Record<string, unknown>, idx)",
    ".map((provider, idx)"
)
content = content.replace(
    ".map((bounce: Record<string, unknown>) => (",
    ".map((bounce) => ("
)
content = content.replace(
    ".slice(0, 10).map((alert: Record<string, unknown>) => (",
    ".slice(0, 10).map((alert) => ("
)
content = content.replace(
    ".map((incident: Record<string, unknown>) => (",
    ".map((incident) => ("
)

open(path, "w").write(content)
print(f"AdminOverviewSections.tsx: {len(content.splitlines())} lines")

# ── 6. Update parent call site ──
parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
pc = open(parent).read()

old_call = """          monitoringProviders={monitoringProviders}
          monitoringBounces={monitoringBounces}
          securityActive={securityActive}
          securityIncidents={securityIncidents}"""
new_call = """          monitoringProviders={monitoringProviders.data?.providers ?? []}
          monitoringBounces={monitoringBounces.data?.bounces ?? []}
          securityActiveAlerts={securityActive.data?.alerts ?? []}
          securityIncidents={securityIncidents.data?.incidents ?? []}"""
pc = pc.replace(old_call, new_call)

# Also fix observability type conflict — cast via unknown
pc = pc.replace(
    "observability={observability}",
    "observability={observability as unknown as LocalObservabilityOverview}"
)

# Import LocalObservabilityOverview too
pc = pc.replace(
    "import { AdminOverviewSections, type LocalSecurityPosture }",
    "import { AdminOverviewSections, type LocalSecurityPosture, type LocalObservabilityOverview }"
)

open(parent, "w").write(pc)
print(f"admin-console-page.tsx: {len(pc.splitlines())} lines")
