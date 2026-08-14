#!/usr/bin/env python3
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(path).readlines()
# Find start of local utils (function percent) and end (just before export function AdminConsolePage)
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if line.startswith("function percent(") and start_idx is None:
        start_idx = i
    if line.startswith("export function AdminConsolePage(") and start_idx is not None:
        end_idx = i
        break

print(f"Removing local utils: lines {start_idx+1}-{end_idx} (keeping AdminConsolePage at {end_idx+1})")
new_lines = lines[:start_idx] + lines[end_idx:]
open(path, "w").writelines(new_lines)
print(f"Done: {len(new_lines)} lines (was {len(lines)})")
