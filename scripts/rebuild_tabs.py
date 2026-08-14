#!/usr/bin/env python3
"""Rebuild DeliverabilityOpsTab + ChangeRequestsTab from git master~2."""
import subprocess, os

orig = subprocess.run(
    ['git', 'show', 'master~2:src/components/admin/admin-console-page.tsx'],
    capture_output=True, text=True, cwd='/root/misfits-web'
).stdout.splitlines()

def extract_tab(lines, start_marker, end_marker_offset):
    """Extract JSX between activeTab conditional markers."""
    start = None
    for i, l in enumerate(lines):
        if start_marker in l:
            start = i + 2  # skip wrapper line + <section line
            break
    if start is None:
        raise ValueError(f"Not found: {start_marker}")
    # Find matching closing )} at depth 0
    depth = 0
    end = None
    for i in range(start - 2, len(lines)):
        for ch in lines[i]:
            if ch == '(': depth += 1
            elif ch == ')': depth -= 1
        if depth == 0 and i > start:
            end = i  # this is the )} line
            break
    # Return inner lines (inside <section>...</section>)
    inner = lines[start - 1 : end - 1]  # include <section, exclude )}
    # Strip the outer <section ...> and </section>
    if inner[0].strip().startswith('<section'):
        inner = inner[1:]
    while inner and inner[-1].strip() in ['', '</section>']:
        inner.pop()
    return inner

# ── DeliverabilityOpsTab ───────────────────────────────────────────────────
deliv = extract_tab(orig, 'activeTab === "deliverability-ops"', 0)
deliv_str = "\n".join(l for l in deliv)

header = '''"use client";

// DeliverabilityOpsTab.tsx — extracted Sprint 3
import type { DeliverabilityProcedureResponse, AdminDeliverabilityDiagnosticsResponse } from "@/types/admin-ops";
import { Badge, asDate, asInt } from "../shared";

interface DeliverabilityOpsTabProps {
  procedureSaving: boolean;
  deliverabilityProcedure: DeliverabilityProcedureResponse | null;
  deliverability: AdminDeliverabilityDiagnosticsResponse | null;
  saveProcedureUpdate: (patch: Partial<DeliverabilityProcedureResponse>) => Promise<void>;
}

export function DeliverabilityOpsTab({
  procedureSaving,
  deliverabilityProcedure,
  deliverability,
  saveProcedureUpdate,
}: DeliverabilityOpsTabProps) {
  return (
    <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
'''

footer = '''    </section>
  );
}
'''

open('/root/misfits-web/src/components/admin/tabs/DeliverabilityOpsTab.tsx', 'w').write(
    header + deliv_str + '\n' + footer
)
print(f"DeliverabilityOpsTab.tsx: {len(deliv)} inner lines")

# ── ChangeRequestsTab — get AlertTriangle import ───────────────────────────
cr_path = '/root/misfits-web/src/components/admin/tabs/ChangeRequestsTab.tsx'
cr_content = open(cr_path).read()
if 'AlertTriangle' not in cr_content.split('from')[0]:
    cr_content = cr_content.replace(
        'import { cn } from "@/lib/utils";',
        'import { cn } from "@/lib/utils";\nimport { AlertTriangle } from "lucide-react";'
    )
    open(cr_path, 'w').write(cr_content)
    print("ChangeRequestsTab.tsx: added AlertTriangle import")
else:
    print("ChangeRequestsTab.tsx: AlertTriangle already imported")
