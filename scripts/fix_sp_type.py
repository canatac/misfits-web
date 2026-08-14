#!/usr/bin/env python3
"""Replace AdminSecurityPostureResponse local type in parent with LocalSecurityPosture import"""
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(path).readlines()

# Find and remove the type AdminSecurityPostureResponse block
start = None
for i, l in enumerate(lines):
    if l.strip() == "type AdminSecurityPostureResponse = {":
        start = i
        break

if start is not None:
    # Find closing }; 
    depth = 0
    end = start
    for j in range(start, len(lines)):
        depth += lines[j].count("{") - lines[j].count("}")
        if depth <= 0 and j > start:
            end = j + 1
            break
    removed = "".join(lines[start:end])
    print(f"Removing L{start+1}-{end}: {removed[:80]}...")
    lines = lines[:start] + lines[end:]

# Replace useState type
content = "".join(lines)
content = content.replace(
    "useState<AdminSecurityPostureResponse | null>(null)",
    "useState<LocalSecurityPosture | null>(null)"
)

open(path, "w").write(content)
print(f"Done: {len(content.splitlines())} lines")
