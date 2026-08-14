#!/usr/bin/env python3
"""Sprint 6 step 4: replace assistant state + snapshot memo + askHermes function with useAdminAssistant hook call."""
import re

parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(parent).readlines()
n = len(lines)

def find_line(pat, start=0):
    for i in range(start, len(lines)):
        if re.search(pat, lines[i]):
            return i
    return -1

def block_end(start):
    depth = 0
    for i in range(start, len(lines)):
        depth += lines[i].count("{") - lines[i].count("}")
        if depth == 0 and i > start:
            return i + 1
    return len(lines)

# State (4 useState calls, contiguous)
s1 = find_line(r'const \[assistantPrompt, setAssistantPrompt\]')
s4 = find_line(r'const \[assistantError, setAssistantError\]')
state_end = s4 + 1
print(f"state: L{s1+1}-{state_end}")

# adminAssistantSnapshot useMemo
memo_start = find_line(r'const adminAssistantSnapshot = useMemo')
# match closing "  );"
memo_end = -1
depth = 0
for i in range(memo_start, len(lines)):
    depth += lines[i].count("(") - lines[i].count(")")
    if depth == 0 and i > memo_start:
        memo_end = i + 1
        break
print(f"memo: L{memo_start+1}-{memo_end}")

# askHermesForAdminPlan async function
ask_start = find_line(r'^\s*async function askHermesForAdminPlan')
ask_end = block_end(ask_start)
print(f"askHermes: L{ask_start+1}-{ask_end}")

hook_call = '''  const {
    assistantPrompt,
    setAssistantPrompt,
    assistantAnswer,
    assistantLoading,
    assistantError,
    adminAssistantSnapshot,
    askHermesForAdminPlan,
  } = useAdminAssistant({
    windowRange,
    severity,
    monitoringSummary,
    monitoringAlerts,
    securityActive,
    monitoringProviders,
    monitoringBounces,
    monitoringLiveEvents: monitoringLive.events,
    securityLiveAlerts: securityLive.alerts,
    observability,
    deliverability,
    deliverabilityProcedure,
    securityPosture,
    adminDataLoading,
    adminDataError,
  });
'''

# Remove in reverse
ranges = sorted([(s1, state_end), (memo_start, memo_end), (ask_start, ask_end)], reverse=True)
new_lines = lines[:]
for s, e in ranges:
    if s == s1:
        new_lines[s:e] = [hook_call]
    else:
        new_lines[s:e] = []

# Add import
imp_pos = 0
for i, l in enumerate(new_lines):
    if l.startswith("import "):
        imp_pos = i + 1
new_lines.insert(imp_pos, 'import { useAdminAssistant } from "@/hooks/useAdminAssistant";\n')

open(parent, "w").writelines(new_lines)
print(f"parent: {len(new_lines)} (was {n})")
