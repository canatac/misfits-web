#!/usr/bin/env python3
"""Remove broken 'type= {...}' fragments left by regex over-removal."""
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(path).readlines()

output = []
skip = False
depth = 0

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Detect broken type fragment
    if stripped.startswith("type= {") or stripped == "type= {":
        skip = True
        depth = 0
    
    if skip:
        depth += line.count("{") - line.count("}")
        if depth <= 0 and stripped.endswith("};"):
            skip = False
        continue
    
    output.append(line)

open(path, "w").writelines(output)
print(f"Done: {len(output)} lines (removed {len(lines)-len(output)} lines)")
