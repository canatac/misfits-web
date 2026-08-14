#!/usr/bin/env python3
"""
split_admin_console.py — Sprint 3
Crée les composants tab depuis admin-console-page.tsx.
Chaque tab devient un composant dans src/components/admin/tabs/.
"""
import os, re

src = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
out_dir = "/root/misfits-web/src/components/admin/tabs"
os.makedirs(out_dir, exist_ok=True)

lines = open(src).readlines()

# Section boundaries (inclusive, 1-indexed)
sections = {
    "OverviewMonitoringSecurityTab": (1288, 1783),
    "DeliverabilityOpsTab":          (1785, 1933),
    "ChangelogTab":                   (1935, 2054),
    "ChangeRequestsTab":              (2056, 3058),
    "UsersTab":                       (3060, 3410),
}

# Header for all shared utilities from the file
header_lines = lines[:371]  # lines 1-371 = "use client" + imports + constants + utils + Badge/tone helpers

# For each tab, create a component file
for name, (start, end) in sections.items():
    tab_lines = lines[start - 1:end]
    
    # Build a clean wrapper
    # The section content is already JSX, we need to wrap it in a function
    # that receives the necessary props
    
    content_inner = "".join(tab_lines)
    
    # We'll create a stub component that simply re-exports the JSX slice.
    # The AdminConsolePage will import and pass all required data as props.
    # For now we create a PLACEHOLDER that makes the intent clear for the next step.
    
    out_path = os.path.join(out_dir, f"{name}.tsx")
    with open(out_path, "w") as f:
        f.write(f'// {name}.tsx — extracted from admin-console-page.tsx Sprint 3\n')
        f.write('// TODO: define props interface and move JSX inside\n')
        f.write('// Source lines: ' + str(start) + '-' + str(end) + '\n\n')
        f.write('"use client";\n\n')
        f.write('// This file is the extraction target for the corresponding tab section.\n')
        f.write('// The full split is a follow-up task once the prop types are stable.\n')
        f.write('// For now this file signals the intent and reserves the module boundary.\n\n')
        f.write(f'export {{ }}; // placeholder — will be filled in Sprint 3 step 2\n')
    
    print(f"Created {name}.tsx ({end - start + 1} lines to move)")

print("Done. Next: define props + move JSX into each tab.")
