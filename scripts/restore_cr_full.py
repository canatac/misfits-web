#!/usr/bin/env python3
"""Replace the broken change-requests section with the full original."""
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(path).readlines()

cr_full = open("/tmp/cr_full.txt").readlines()

# Find change-requests section start in current file
start = None
for i, l in enumerate(lines):
    if '{activeTab === "change-requests"' in l:
        start = i
        break

# Find its end — look for )}\n followed by {activeTab === "users"
end = None
for i in range(start + 1, len(lines)):
    if '{activeTab === "users"' in lines[i]:
        end = i
        break

if start is None or end is None:
    print(f"ERROR: start={start} end={end}")
    exit(1)

print(f"Replacing lines {start+1}-{end} ({end-start} lines) with {len(cr_full)} lines")

lines = lines[:start] + cr_full + ["\n"] + lines[end:]
open(path, "w").writelines(lines)
print(f"Done. admin-console-page.tsx: {len(lines)} lines")
