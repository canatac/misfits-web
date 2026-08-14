#!/usr/bin/env python3
"""Fix AdminOverviewSections proactive_alerting type and all remaining issues"""

aos = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
lines = open(aos).readlines()
content = "".join(lines)

# 1. Fix proactive_alerting type block (L69-81)
old_pa = """  proactive_alerting?: {
    enabled?: boolean;
    active_rules?: number;
    last_triggered?: string | null;
    active_alerts?: Array<{ id: string; severity: string; message: string; ts: string }>;
    threshold_alerts?: number;
    lookup_issue_events?: number;
    listed_by?: number;
    queue_growth?: number | { pct?: number };
    auth_failures?: number | { count?: number };
    imap_latency_alert?: boolean;
    correlation?: { enabled?: boolean; window_minutes?: number; matched?: number; dns?: number; blacklist?: number };
  };"""

new_pa = """  proactive_alerting?: {
    enabled?: boolean;
    active_rules?: number;
    last_triggered?: string | null;
    active_alerts?: Array<{ id: string; severity: string; message: string; ts: string }>;
    threshold_alerts?: {
      queue_growth?: number;
      auth_failures?: number;
      imap_latency_alert?: boolean;
    };
    correlation?: {
      enabled?: boolean; window_minutes?: number; matched?: number;
      dns?: { lookup_issue_events?: number };
      blacklist?: { listed_by?: string[] };
    };
  };"""

content = content.replace(old_pa, new_pa)
assert "queue_growth?: number;" in content, "Patch failed!"

# 2. Fix securityLive.data → securityLive.alerts at L579
content = content.replace("securityLive.data?.alerts", "securityLive.alerts")

# 3. Fix monitoringLive event type — it uses .event_type and .to (it's a SmtpEvent-like)
# L605-607: evt.event_type, evt.to — update monitoringLive event type
content = content.replace(
    "monitoringLive?: { isConnected?: boolean; events?: Array<{ id?: string; kind?: string; ts?: string; message?: string; level?: string }> };",
    "monitoringLive?: { isConnected?: boolean; events?: Array<{ id?: string; kind?: string; event_type?: string; ts?: string; message?: string; level?: string; to?: string }> };"
)
# And fix asDate(evt.ts) where ts could be undefined
content = content.replace("asDate(evt.ts)", "asDate(evt.ts ?? '')")

# 4. Ensure MonitoringProvider and SmtpEvent are imported
if 'import type { MonitoringProvider, SmtpEvent }' not in content:
    content = content.replace(
        'import type { SecurityAlert } from "@/types/security";',
        'import type { SecurityAlert } from "@/types/security";\nimport type { MonitoringProvider, SmtpEvent } from "@/types/monitoring";'
    )

open(aos, "w").write(content)
print(f"AdminOverviewSections: {len(content.splitlines())} lines")

# 5. ChatPanelProps: layout="docked" is used in mail/page.tsx and novamail-workspace-shell.tsx
# Add "docked" as a valid layout option
cp = "/root/misfits-web/src/components/mail/chat-panel.tsx"
cpc = open(cp).read()
cpc = cpc.replace(
    'layout?: "overlay" | "inline";',
    'layout?: "overlay" | "inline" | "docked";'
)
open(cp, "w").write(cpc)
print("chat-panel: docked layout added")
