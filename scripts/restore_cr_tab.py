#!/usr/bin/env python3
"""
Revert ChangeRequestsTab extraction: put the section back inline in admin-console-page.tsx.
This also restores workflowRunMonitoring and kanbanColumns useMemo.
"""
import subprocess

orig = subprocess.run(
    ['git', 'show', 'master~2:src/components/admin/admin-console-page.tsx'],
    capture_output=True, text=True, cwd='/root/misfits-web'
).stdout.splitlines(keepends=True)

# Extract workflowRunMonitoring useMemo block (L1051 in original)
# and kanbanColumns useMemo (L1040 in original)
# Look for them
wf_start = None
kanban_start = None
for i, l in enumerate(orig):
    if 'const kanbanColumns = useMemo' in l:
        kanban_start = i
    if 'const workflowRunMonitoring = useMemo' in l:
        wf_start = i

# Extract useMemo blocks (until next blank line after closing })
def extract_memo(lines, start):
    """Extract a useMemo block from start until depth returns to 0."""
    depth = 0
    started = False
    result = []
    for l in lines[start:]:
        result.append(l)
        for ch in l:
            if ch == '{': depth += 1; started = True
            elif ch == '}': depth -= 1
        if started and depth == 0:
            # include the , [deps] line
            break
    # also grab the dependency array line if on same line
    return result

kanban_block = extract_memo(orig, kanban_start) if kanban_start else []
wf_block = extract_memo(orig, wf_start) if wf_start else []

print(f"kanbanColumns block: {len(kanban_block)} lines (L{kanban_start+1})")
print(f"workflowRunMonitoring block: {len(wf_block)} lines (L{wf_start+1})")

# Read current admin-console-page.tsx
path = '/root/misfits-web/src/components/admin/admin-console-page.tsx'
current = open(path).readlines()

# 1. Re-inject kanbanColumns + workflowRunMonitoring before the changeRequests line
# Find insertion point: after "const changeRequests = useChangeRequests();"
insert_at = None
for i, l in enumerate(current):
    if 'const changeRequests = useChangeRequests()' in l:
        insert_at = i + 2  # insert 2 lines after
        break

if insert_at:
    current = current[:insert_at] + ['\n'] + kanban_block + ['\n'] + wf_block + ['\n'] + current[insert_at:]
    print(f"Injected useMemo blocks at line {insert_at+1}")

# 2. Restore ChangeRequestsTab section inline (replace the <ChangeRequestsTab .../> call)
# Find the ChangeRequestsTab call
cr_start = None
cr_end = None
for i, l in enumerate(current):
    if '{activeTab === "change-requests"' in l:
        cr_start = i
    if cr_start and i > cr_start and '/>}' in l.replace(' ', '') or (cr_start and i > cr_start and '/>\n' in l and ')}' in current[i+1] if i+1 < len(current) else False):
        cr_end = i + 1
        break
    if cr_start and i > cr_start and l.strip() == ')}':
        cr_end = i + 1
        break

# Get the original CR section from master~2
cr_section = [l for l in orig[1836:2839]]  # L1837-L2838 (0-indexed: 1836:2839)

if cr_start is not None and cr_end is not None:
    current = current[:cr_start] + cr_section + current[cr_end:]
    print(f"Restored ChangeRequestsTab section at lines {cr_start+1}-{cr_end}")
else:
    print(f"WARN: ChangeRequestsTab call not found: cr_start={cr_start} cr_end={cr_end}")

open(path, 'w').writelines(current)
print(f"Done. admin-console-page.tsx: {len(current)} lines")
