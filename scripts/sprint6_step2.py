#!/usr/bin/env python3
"""
Sprint 6 step 2:
Replace in admin-console-page.tsx:
- the 7 useState declarations (securityPosture, deliverability, deliverabilityProcedure,
  observability, adminDataLoading, adminDataError, procedureSaving)
- the useEffect loadAdminData block
- the saveProcedureUpdate function
with a single useAdminData(windowRange) hook call.
"""
import re

parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(parent).readlines()
n = len(lines)

def find_line(pattern, start=0):
    for i in range(start, len(lines)):
        if re.search(pattern, lines[i]):
            return i
    return -1

# ── Locate the state block ─────────────────────────────────────
s_start = find_line(r'const \[securityPosture, setSecurityPosture\]')
# procedureSaving state is the last of the group
s_last = find_line(r'const \[procedureSaving, setProcedureSaving\]')
s_end = s_last + 1
print(f"state block: L{s_start+1}-{s_end}")

# ── Locate useEffect(loadAdminData) ────────────────────────────
e_start = find_line(r'^\s*useEffect\(\(\) => \{', s_end)
# Find matching closure "}, [windowRange]);"
e_end = find_line(r'^\s*\}, \[windowRange\]\);', e_start) + 1
print(f"useEffect block: L{e_start+1}-{e_end}")

# ── Locate saveProcedureUpdate ────────────────────────────────
p_start = find_line(r'^\s*async function saveProcedureUpdate', e_end)
depth = 0
p_end = -1
for i in range(p_start, len(lines)):
    depth += lines[i].count("{") - lines[i].count("}")
    if depth == 0 and i > p_start:
        p_end = i + 1
        break
print(f"saveProcedureUpdate: L{p_start+1}-{p_end}")

# ── Build replacement ─────────────────────────────────────────
hook_call = '''  const {
    securityPosture,
    deliverability,
    deliverabilityProcedure,
    observability,
    adminDataLoading,
    adminDataError,
    procedureSaving,
    saveProcedureUpdate,
  } = useAdminData(windowRange);
'''

# Remove blocks in reverse order to keep indices valid
new_lines = lines[:s_start] + [hook_call] + lines[s_end:e_start] + lines[e_end:p_start] + lines[p_end:]

open(parent, "w").writelines(new_lines)
print(f"parent: {len(new_lines)} lines (was {n})")
