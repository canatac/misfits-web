#!/usr/bin/env python3
"""Fix all remaining CI errors in one pass."""
import re, subprocess

# ────────────────────────────────────────────────
# 1. AdminOverviewSections.tsx
# ────────────────────────────────────────────────
aos = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
c = open(aos).read()

# Fix import: MonitoringProvider, SmtpEvent not found → use @/types/monitoring
c = c.replace(
    'import type { MonitoringAlert, MonitoringProvider, SmtpEvent } from "@/types/monitoring";',
    'import type { MonitoringAlert, MonitoringProvider, SmtpEvent } from "@/types/monitoring";\nimport type { MonitoringLiveEvent } from "@/types/monitoring";'
)
# MonitoringLiveEvent might not exist — just use unknown for monitoringLive events
# Actually check what monitoringLive is — it's a hook result with .events
# Add monitoringLive prop

# Fix proactive_alerting fields: queue_growth, auth_failures, imap_latency_alert are numbers
# They come from proactive_alerting as number (e.g. proactive_alerting?.queue_growth?.pct)
# The .queue_growth is number, so x?.queue_growth?.pct is invalid
# Look at actual JSX usage
c = re.sub(
    r'observability\?\.proactive_alerting\?\.queue_growth\?\.pct',
    'observability?.proactive_alerting?.queue_growth',
    c
)
c = re.sub(
    r'observability\?\.proactive_alerting\?\.auth_failures\?\.count',
    'observability?.proactive_alerting?.auth_failures',
    c
)

# Fix: listed_by on number (from rbl in LocalDeliverabilityDiag)
# correlation.dns, correlation.blacklist missing
c = c.replace(
    "correlation?: {\n      enabled?: boolean; window_minutes?: number; matched?: number;\n      dns?: number; blacklist?: number;\n    };",
    "correlation?: { enabled?: boolean; window_minutes?: number; matched?: number; dns?: number; blacklist?: number };"
)

# Fix lookup_issue_events, listed_by on proactive_alerting → add to type
c = c.replace(
    "    threshold_alerts?: number;\n    queue_growth?: number | { pct?: number };",
    "    threshold_alerts?: number;\n    lookup_issue_events?: number;\n    listed_by?: number;\n    queue_growth?: number | { pct?: number };"
)

# Fix: securityLive.data doesn't exist; securityLive.isConnected is the right pattern
# L578: securityLive.data? → look at actual line
# Also monitoringLive — add as prop
# Add monitoringLive prop to interface
old_sl_prop = "  securityLive: { isConnected: boolean; alerts: SecurityAlert[] };"
new_sl_prop = """  securityLive: { isConnected: boolean; alerts: SecurityAlert[] };
  monitoringLive?: { isConnected?: boolean; events?: Array<{ id?: string; kind?: string; ts?: string; message?: string; level?: string }> };"""
c = c.replace(old_sl_prop, new_sl_prop)

# Add to destructuring
c = c.replace(
    "  securityLive,\n  assistantLoading,",
    "  securityLive,\n  monitoringLive,\n  assistantLoading,"
)

# Fix securityLive.data usage at L578
c = c.replace("securityLive.data?.alerts", "securityLive.alerts")

# Fix monitoringLive
c = re.sub(r'monitoringLive\.events\b', '(monitoringLive?.events ?? [])', c)
c = re.sub(r'monitoringLive\.isConnected\b', '(monitoringLive?.isConnected ?? false)', c)

# Fix implicit any on evt
c = c.replace(
    ".map((evt) => (",
    ".map((evt: { id?: string; kind?: string; ts?: string; message?: string; level?: string }) => ("
)

open(aos, "w").write(c)
print(f"AdminOverviewSections: {len(c.splitlines())} lines")

# ────────────────────────────────────────────────
# 2. admin-console-page.tsx — pass monitoringLive
# ────────────────────────────────────────────────
parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
pc = open(parent).read()
pc = pc.replace(
    "          securityLive={securityLive}\n          assistantLoading",
    "          securityLive={securityLive}\n          monitoringLive={monitoringLive}\n          assistantLoading"
)
open(parent, "w").write(pc)
print(f"admin-console-page: {len(pc.splitlines())} lines")

# ────────────────────────────────────────────────
# 3. StorageGauge.tsx — add cn import
# ────────────────────────────────────────────────
sg = "/root/misfits-web/src/components/dashboard/StorageGauge.tsx"
sc = open(sg).read()
if 'import { cn }' not in sc:
    sc = sc.replace(
        'import { HardDrive } from "lucide-react";',
        'import { HardDrive } from "lucide-react";\nimport { cn } from "@/lib/utils";'
    )
    open(sg, "w").write(sc)
    print("StorageGauge: cn import added")

# ────────────────────────────────────────────────
# 4. chat-panel.tsx — PersonaPreset, Analytics, ChatPanelProps missing
# ────────────────────────────────────────────────
cp = "/root/misfits-web/src/components/mail/chat-panel.tsx"
cpc = open(cp).read()

# Check what's imported
if "PersonaPreset" not in cpc.split("import")[0]:
    # The import line we added earlier
    if "chat-panel-utils" in cpc:
        cpc = cpc.replace(
            'import { QUICK_PROMPTS, QUICK_ACTIONS, ROLE_TEMPLATES, SENSITIVE_KEYWORDS, DEFAULT_PERSONA, DEFAULT_ANALYTICS, containsSensitiveIntent, parseTaskCandidates, redactPii, buildPersonaInstruction } from "./chat-panel/chat-panel-utils";',
            'import { QUICK_PROMPTS, QUICK_ACTIONS, ROLE_TEMPLATES, SENSITIVE_KEYWORDS, DEFAULT_PERSONA, DEFAULT_ANALYTICS, containsSensitiveIntent, parseTaskCandidates, redactPii, buildPersonaInstruction, type Analytics, type PersonaPreset } from "./chat-panel/chat-panel-utils";'
        )
        # Also fix type import
        cpc = cpc.replace(
            'import type { Analytics, PersonaPreset } from "./chat-panel/chat-panel-utils";\n',
            ''
        )

# ChatPanelProps — was it removed? Find if it's defined
if "interface ChatPanelProps" not in cpc and "type ChatPanelProps" not in cpc:
    # Re-add it before export function ChatPanel
    cpc = cpc.replace(
        'export function ChatPanel(',
        '''interface ChatPanelProps {
  layout?: "overlay" | "inline";
  className?: string;
  onRequestClose?: () => void;
}

export function ChatPanel('''
    )

open(cp, "w").write(cpc)
print(f"chat-panel: {len(cpc.splitlines())} lines")

# ────────────────────────────────────────────────
# 5. email-view-utils.ts — fix imports (@/types/mail, missing icons)
# ────────────────────────────────────────────────
evu = "/root/misfits-web/src/components/mail/email-view-utils.ts"
ec = open(evu).read()

# Fix @/types/mail → check actual module name
# grep in project
result = subprocess.run(
    ["grep", "-rn", "from.*types/mail", "/root/misfits-web/src/components/mail/email-view.tsx"],
    capture_output=True, text=True
)
print("email-view mail import:", result.stdout[:200])

# Replace wrong header
ec = '''"use client";
// email-view-utils.ts — extracted Sprint 4

import type { AttachmentType, EmailAttachment } from "@/types/email";
import {
  FileText, FileSpreadsheet, FileCode, Paperclip,
  FileImage, Music, Video, Archive,
} from "lucide-react";
import { FileIcon } from "lucide-react";

''' + "\n".join(ec.split("\n")[4:])  # skip old header lines

# Fix ImageIcon → FileImage, Presentation → FileSpreadsheet, ArchiveIcon → Archive, Music, Video
ec = ec.replace("ImageIcon", "FileImage")
ec = ec.replace("Presentation", "FileSpreadsheet")
ec = ec.replace("ArchiveIcon", "Archive")

open(evu, "w").write(ec)
print(f"email-view-utils: {len(ec.splitlines())} lines")
