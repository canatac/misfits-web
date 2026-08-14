#!/usr/bin/env python3
"""
Patch AdminOverviewSections.tsx to:
1. Rename local types to avoid conflicts with parent
2. Add missing props (assistantLoading, summaryCards, etc.)
3. Fix securityPosture.security structure
4. Fix dashboard/page.tsx takeaways possibly undefined
"""

# ── AdminOverviewSections.tsx ──
path = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
content = open(path).read()

# 1. Rename local types to avoid module-instance conflicts
content = content.replace(
    "type AdminSecurityPostureResponse = {",
    "type LocalSecurityPosture = {"
)
content = content.replace(
    "type AdminDeliverabilityDiagnosticsResponse = {",
    "type LocalDeliverabilityDiag = {"
)
content = content.replace(
    "type AdminObservabilityOverviewResponse = {",
    "type LocalObservabilityOverview = {"
)

# 2. Update props interface to use renamed types + add missing props
old_props = """interface AdminOverviewSectionsProps {
  activeTab: ActiveTabScope;
  observability: AdminObservabilityOverviewResponse | null;
  securityPosture: AdminSecurityPostureResponse | null;
  deliverability: AdminDeliverabilityDiagnosticsResponse | null;
  adminDataLoading: boolean;
  adminDataError: string | null;
  securityLive: { isConnected: boolean; alerts: SecurityAlert[] };
}"""
new_props = """interface SummaryCard {
  label: string; value: string | number; note: string;
  // eslint-disable-line @typescript-eslint/no-explicit-any
  icon: React.ElementType;
}

interface AdminOverviewSectionsProps {
  activeTab: ActiveTabScope;
  observability: LocalObservabilityOverview | null;
  securityPosture: LocalSecurityPosture | null;
  deliverability: LocalDeliverabilityDiag | null;
  adminDataLoading: boolean;
  adminDataError: string | null;
  securityLive: { isConnected: boolean; alerts: SecurityAlert[] };
  assistantLoading: boolean;
  assistantPrompt: string;
  setAssistantPrompt: (v: string) => void;
  assistantAnswer: string;
  assistantError: string | null;
  askHermesForAdminPlan: () => void;
  summaryCards: readonly SummaryCard[];
}"""
content = content.replace(old_props, new_props)

# 3. Update destructuring to include new props
old_dest = """export function AdminOverviewSections({
  activeTab,
  observability,
  securityPosture,
  deliverability,
  adminDataLoading,
  adminDataError,
  securityLive,
}: AdminOverviewSectionsProps) {"""
new_dest = """export function AdminOverviewSections({
  activeTab,
  observability,
  securityPosture,
  deliverability,
  adminDataLoading,
  adminDataError,
  securityLive,
  assistantLoading,
  assistantPrompt,
  setAssistantPrompt,
  assistantAnswer,
  assistantError,
  askHermesForAdminPlan,
  summaryCards,
}: AdminOverviewSectionsProps) {"""
content = content.replace(old_dest, new_dest)

# 4. Add React import for ElementType
if "import React" not in content and "React.ElementType" in content:
    content = content.replace(
        '"use client";',
        '"use client";\nimport React from "react";'
    )

# 5. Fix securityPosture.security — add security field to LocalSecurityPosture
old_sp = """type LocalSecurityPosture = {
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
};"""
new_sp = """type LocalSecurityPosture = {
  threat_events?: number;
  auth_failures_total?: number;
  suspicious_ips_count?: number;
  blocked_events?: number;
  alerts?: Array<{
    id: string; severity: string; title: string; description: string;
    at: string; remediation?: string;
  }>;
  ip_reputation?: Array<{
    ip: string; risk_score: number; is_blocked: boolean; last_seen_at: string;
  }>;
  security?: {
    tls?: {
      smtp_starttls_required?: boolean;
      smtps_listener?: string;
      imaps_listener?: string;
    };
    authentication?: {
      sasl_mechanisms?: string[];
      oauth2_enabled?: boolean;
      admin_mfa_required?: boolean;
    };
    anti_abuse?: {
      rate_limit_enabled?: boolean;
      rate_limit_per_minute?: number;
      fail2ban_enabled?: boolean;
    };
  };
};"""
content = content.replace(old_sp, new_sp)

open(path, "w").write(content)
print(f"AdminOverviewSections.tsx: {len(content.splitlines())} lines")

# ── dashboard/page.tsx ── fix takeaways possibly undefined
page = "/root/misfits-web/src/app/dashboard/page.tsx"
pg = open(page).read()
pg = pg.replace(
    "{detailItem.data.takeaways.map(",
    "{(detailItem.data.takeaways ?? []).map("
)
open(page, "w").write(pg)
print("dashboard/page.tsx: takeaways fixed")
