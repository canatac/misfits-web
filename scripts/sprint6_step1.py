#!/usr/bin/env python3
"""
Sprint 6 step 1:
- Move local types (AdminDeliverabilityDiagnosticsResponse, DeliverabilityProcedureData,
  AdminObservabilityOverviewResponse) from admin-console-page.tsx to src/types/admin-console.ts
- Replace with imports in parent
- Remove loadAdminData effect + saveProcedureUpdate + related state from parent,
  replace with useAdminData() hook call
"""
import re

parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(parent).readlines()
n = len(lines)
print(f"parent: {n} lines")

def find_line(pattern, start=0):
    for i in range(start, len(lines)):
        if re.search(pattern, lines[i]):
            return i
    return -1

# ── 1. Extract types block ────────────────────────────────────
t1 = find_line(r'^type AdminDeliverabilityDiagnosticsResponse')
# Find end of AdminObservabilityOverviewResponse block
t3 = find_line(r'^type AdminObservabilityOverviewResponse')
# find closing }; after t3
depth = 0
t3_end = -1
for i in range(t3, len(lines)):
    depth += lines[i].count("{") - lines[i].count("}")
    if depth == 0 and i > t3:
        t3_end = i + 1
        break
print(f"types block: L{t1+1}-{t3_end}")

types_block = "".join(lines[t1:t3_end])
types_content = (
    "// admin-console.ts — shared admin console API response types (Sprint 6)\n\n"
    + types_block.replace("type Admin", "export type Admin").replace("type Deliverability", "export type Deliverability")
)
open("/root/misfits-web/src/types/admin-console.ts", "w").write(types_content)
print(f"types/admin-console.ts: {len(types_content.splitlines())} lines")

# ── 2. Remove types from parent, add import ───────────────────
new_lines = lines[:t1] + [
    'import type {\n',
    '  AdminDeliverabilityDiagnosticsResponse,\n',
    '  DeliverabilityProcedureData,\n',
    '  AdminObservabilityOverviewResponse,\n',
    '} from "@/types/admin-console";\n',
    'import { useAdminData } from "@/hooks/useAdminData";\n',
] + lines[t3_end:]

open(parent, "w").writelines(new_lines)
print(f"parent after type removal: {len(new_lines)} lines")
