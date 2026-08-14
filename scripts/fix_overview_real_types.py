#!/usr/bin/env python3
"""Replace simplified prop types with real types from @/types/monitoring and @/types/security"""
path = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
content = open(path).read()

# 1. Add imports
old_import = """import type { SecurityAlert } from "@/types/security";
import type { MonitoringAlert } from "@/types/monitoring";"""
new_import = """import type { SecurityAlert } from "@/types/security";
import type { MonitoringAlert, MonitoringProvider, SmtpEvent } from "@/types/monitoring";"""
content = content.replace(old_import, new_import)

# 2. Fix props interface for providers/bounces/incidents
old_props = """  monitoringProviders?: Array<{ name?: string; status?: string; latency_ms?: number; success_rate?: number; region?: string }>;
  monitoringBounces?: Array<{ email?: string; reason?: string; at?: string; code?: number }>;
  securityActiveAlerts?: SecurityAlert[];
  securityIncidents?: Array<{ id?: string; severity?: string; title?: string; at?: string; status?: string }>;"""
new_props = """  monitoringProviders?: MonitoringProvider[];
  monitoringBounces?: SmtpEvent[];
  securityActiveAlerts?: SecurityAlert[];
  securityIncidents?: SecurityAlert[];"""
content = content.replace(old_props, new_props)

# 3. Fix proactive_alerting.threshold_alerts, .auth_failures, .queue_growth, .imap_latency_alert
# These are inside proactive_alerting — add them to the type
old_pa = """  proactive_alerting?: {
    enabled?: boolean;
    active_rules?: number;
    last_triggered?: string | null;
    active_alerts?: Array<{ id: string; severity: string; message: string; ts: string }>;
    threshold_alerts?: number;
    correlation?: { enabled?: boolean; window_minutes?: number; matched?: number };
  };"""
new_pa = """  proactive_alerting?: {
    enabled?: boolean;
    active_rules?: number;
    last_triggered?: string | null;
    active_alerts?: Array<{ id: string; severity: string; message: string; ts: string }>;
    threshold_alerts?: number;
    queue_growth?: number | { pct?: number };
    auth_failures?: number | { count?: number };
    imap_latency_alert?: boolean;
    correlation?: {
      enabled?: boolean; window_minutes?: number; matched?: number;
      dns?: number; blacklist?: number;
    };
  };"""
content = content.replace(old_pa, new_pa)

# 4. Fix securityIncidents.data — the response has .alerts not .incidents
parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
pc = open(parent).read()
pc = pc.replace(
    "securityIncidents={securityIncidents.data?.incidents ?? []}",
    "securityIncidents={securityIncidents.data?.alerts ?? []}"
)
open(parent, "w").write(pc)
print(f"admin-console-page.tsx: incidents → alerts")

open(path, "w").write(content)
print(f"AdminOverviewSections.tsx: {len(content.splitlines())} lines")
