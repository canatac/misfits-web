#!/usr/bin/env python3
"""Fix all remaining CI errors — final pass"""

# ── 1. AdminOverviewSections: MonitoringProvider/SmtpEvent not found
# The import line with type keyword wasn't applied — check file
aos = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
c = open(aos).read()

# Fix import — ensure it's there with correct syntax
if "MonitoringProvider" not in c.split("import")[1] if "import" in c else True:
    c = c.replace(
        'import type { SecurityAlert } from "@/types/security";',
        'import type { SecurityAlert } from "@/types/security";\nimport type { MonitoringProvider, SmtpEvent } from "@/types/monitoring";'
    )

# Fix queue_growth, auth_failures, imap_latency_alert, lookup_issue_events, listed_by
# These fields are accessed as .queue_growth on proactive_alerting (which has threshold_alerts: number)
# They need to be in proactive_alerting type
# Current type has threshold_alerts as number — the JSX does:
#   observability?.proactive_alerting?.queue_growth?.pct  → queue_growth is a sub-object
# Let's see what L374 says
lines = c.split("\n")
print("L370-400:")
for i, l in enumerate(lines[369:400], 370):
    print(f"{i}: {l}")

open(aos, "w").write(c)
