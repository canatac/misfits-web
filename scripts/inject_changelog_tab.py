#!/usr/bin/env python3
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(path).readlines()

# Replace the changelog section (L1831-1950) with <ChangelogTab adminChangelog={adminChangelog} />
start_idx = None
end_idx   = None
for i, line in enumerate(lines):
    if 'activeTab === "changelog"' in line and start_idx is None:
        start_idx = i
    if start_idx is not None and 'activeTab === "change-requests"' in line:
        end_idx = i
        break

print(f"Changelog block: lines {start_idx+1}-{end_idx} (change-requests starts at {end_idx+1})")

replacement = [
    '      {activeTab === "changelog" && (\n',
    '        <ChangelogTab adminChangelog={adminChangelog} />\n',
    '      )}\n',
    '\n',
]

new_lines = lines[:start_idx] + replacement + lines[end_idx:]
open(path, "w").writelines(new_lines)
print(f"Done: {len(new_lines)} lines (was {len(lines)})")
