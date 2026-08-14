#!/usr/bin/env python3
"""Sprint 6b: replace 9 handler functions with useAdminActions hook call."""
import re
parent = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(parent).readlines()

def find_line(pat, start=0):
    for i in range(start, len(lines)):
        if re.search(pat, lines[i]):
            return i
    return -1

def block_end(start):
    """Find end of a function/block starting at 'start'. Skip lines until first '{', then track depth."""
    depth = 0
    seen_open = False
    for i in range(start, len(lines)):
        opens = lines[i].count("{")
        closes = lines[i].count("}")
        if opens > 0:
            seen_open = True
        depth += opens - closes
        if seen_open and depth == 0:
            return i + 1
    return len(lines)

names = [
    r'async function handleCreateChangeRequest',
    r'async function handleTransition',
    r'function openDeleteChangeRequestDialog',
    r'async function handleDeleteChangeRequestConfirm',
    r'async function handleStartImplementation',
    r'async function handleUserRoleChange',
    r'async function handleUserStatusChange',
    r'async function handleCreateUser',
    r'async function handleDeleteUser',
]

ranges = []
for pat in names:
    s = find_line(pat)
    if s == -1:
        print(f"MISS: {pat}"); continue
    e = block_end(s)
    ranges.append((s, e))
    print(f"{pat}: L{s+1}-{e}")

# Replace first with hook call, remove rest
hook_call = '''  const {
    handleCreateChangeRequest,
    handleTransition,
    openDeleteChangeRequestDialog,
    handleDeleteChangeRequestConfirm,
    handleStartImplementation,
    handleUserRoleChange,
    handleUserStatusChange,
    handleCreateUser,
    handleDeleteUser,
  } = useAdminActions({
    newRequest, setNewRequest,
    newAdminUser, setNewAdminUser,
    transitionNote,
    deleteDialogTarget, setDeleteDialogTarget,
    qualityScore: qualityChecks.score,
    createChangeRequest,
    transitionChangeRequest,
    deleteChangeRequest,
    startImplementationChangeRequest,
    updateAdminUser,
    createAdminUser,
    deleteAdminUser,
  });
'''

# Apply in reverse
new_lines = lines[:]
ranges_rev = sorted(ranges, reverse=True)
first_s = ranges[0][0]
for s, e in ranges_rev:
    if s == first_s:
        new_lines[s:e] = [hook_call]
    else:
        new_lines[s:e] = []

# Add import
imp_pos = 0
for i, l in enumerate(new_lines):
    if l.startswith("import "):
        imp_pos = i + 1
new_lines.insert(imp_pos, 'import { useAdminActions } from "@/hooks/useAdminActions";\n')

open(parent, "w").writelines(new_lines)
print(f"parent: {len(new_lines)} lines")
