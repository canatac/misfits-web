#!/usr/bin/env python3
"""
Extract AdminOverviewSections (L1173-1669) from admin-console-page.tsx
into src/components/admin/tabs/AdminOverviewSections.tsx
"""
import subprocess, re

orig_path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
out_path  = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"

lines = open(orig_path).readlines()

# L1173-1669 (0-indexed: 1172:1669)
block = lines[1172:1669]
inner = "".join(block)

# Detect types used
# securityPosture type
sp_type = "AdminSecurityPostureResponse"
obs_type = "AdminObservabilityOverviewResponse"
deliv_type = "AdminDeliverabilityDiagnosticsResponse"

header = '''"use client";

// AdminOverviewSections.tsx — extracted Sprint 3
// Shared diagnostic sections for overview / monitoring / security tabs
import { cn } from "@/lib/utils";
import { Badge, asDate, asInt, percent } from "../shared";

type ActiveTabScope = "overview" | "monitoring" | "security";

type AdminSecurityPostureResponse = {
  threat_events?: number;
  auth_failures_total?: number;
  suspicious_ips_count?: number;
  blocked_events?: number;
  alerts?: Array<{
    id: string;
    severity: string;
    title: string;
    description: string;
    at: string;
    remediation?: string;
  }>;
  ip_reputation?: Array<{
    ip: string;
    risk_score: number;
    is_blocked: boolean;
    last_seen_at: string;
  }>;
};

type AdminDeliverabilityDiagnosticsResponse = {
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

type AdminObservabilityOverviewResponse = {
  smtp?: { total_events?: number; failure_events?: number; p95_total_ms?: number };
  health_realtime?: {
    queue?: { depth?: number; oldest_age_seconds?: number | null };
    throughput?: { incoming_per_min?: number; outgoing_per_min?: number };
    delivery?: { success_rate?: number; smtp_4xx_rate?: number; smtp_5xx_rate?: number; p95_total_ms?: number };
  };
};

interface AdminOverviewSectionsProps {
  activeTab: ActiveTabScope;
  observability: AdminObservabilityOverviewResponse | null;
  securityPosture: AdminSecurityPostureResponse | null;
  deliverability: AdminDeliverabilityDiagnosticsResponse | null;
  adminDataLoading: boolean;
  adminDataError: string | null;
}

export function AdminOverviewSections({
  activeTab,
  observability,
  securityPosture,
  deliverability,
  adminDataLoading,
  adminDataError,
}: AdminOverviewSectionsProps) {
  return (
    <>
'''

footer = '''    </>
  );
}
'''

# Indent the block 2 spaces (it was indented 6 spaces, trim to 4 = 2 less)
def dedent(s):
    lines_s = s.split("\n")
    result = []
    for l in lines_s:
        if l.startswith("      "):
            result.append("  " + l[6:])
        elif l.startswith("    "):
            result.append(l[2:])
        else:
            result.append(l)
    return "\n".join(result)

body = dedent(inner)

content = header + body + footer
open(out_path, "w").write(content)
print(f"AdminOverviewSections.tsx: {len(content.splitlines())} lines")

# Now replace in parent
new_call = """      {(activeTab === "overview" ||
        activeTab === "monitoring" ||
        activeTab === "security") && (
        <AdminOverviewSections
          activeTab={activeTab as "overview" | "monitoring" | "security"}
          observability={observability}
          securityPosture={securityPosture}
          deliverability={deliverability}
          adminDataLoading={adminDataLoading}
          adminDataError={adminDataError}
        />
      )}
"""

parent = open(orig_path).read()
old_block = "".join(lines[1172:1669])
parent = parent.replace(old_block, new_call)
open(orig_path, "w").write(parent)
print(f"admin-console-page.tsx: {len(parent.splitlines())} lines (was {len(lines)})")
