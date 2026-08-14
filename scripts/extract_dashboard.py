#!/usr/bin/env python3
"""
Sprint 4-1: Extract dashboard/page.tsx sections into sub-components.
- src/app/dashboard/dashboard-fixtures.ts : VEILLE, TASKS, ALERTS, AGENDA (to be replaced by API)
- src/components/dashboard/StorageGauge.tsx : StorageGauge component + formatTime
- src/app/dashboard/page.tsx: cleaned up (removes inline consts + inline components)
"""
import re, os

page_path = "/root/misfits-web/src/app/dashboard/page.tsx"
lines = open(page_path).readlines()
content = open(page_path).read()

os.makedirs("/root/misfits-web/src/components/dashboard", exist_ok=True)
os.makedirs("/root/misfits-web/src/app/dashboard", exist_ok=True)

# ── 1. Extract constants (VEILLE L58-99, TASKS L100-135, ALERTS L136-175)
# Find boundaries
def find_const(name, lines):
    start = None
    for i, l in enumerate(lines):
        if l.startswith(f"const {name} = ["):
            start = i
            break
    if start is None:
        return None, None, None
    # Find matching ]
    depth = 0
    for j in range(start, len(lines)):
        depth += lines[j].count("[") - lines[j].count("]")
        if depth <= 0 and j > start:
            return start, j + 1, "".join(lines[start:j+1])
    return start, len(lines), "".join(lines[start:])

v_start, v_end, veille_code = find_const("VEILLE", lines)
t_start, t_end, tasks_code = find_const("TASKS", lines)
a_start, a_end, alerts_code = find_const("ALERTS", lines)

print(f"VEILLE: L{v_start+1}-{v_end}")
print(f"TASKS: L{t_start+1}-{t_end}")
print(f"ALERTS: L{a_start+1}-{a_end}")

# Write fixtures file
fixtures = f'''// dashboard-fixtures.ts
// TODO Sprint 5: Replace with real API calls
// These are placeholder data for UI development

{veille_code}
{tasks_code}
{alerts_code}
'''
open("/root/misfits-web/src/app/dashboard/dashboard-fixtures.ts", "w").write(fixtures)
print(f"dashboard-fixtures.ts: {len(fixtures.splitlines())} lines")

# ── 2. Extract StorageGauge (L184-239) and formatTime (L177-183)
fg_start, fg_end = 176, 239  # 0-indexed
storage_block = "".join(lines[fg_start:fg_end])

storage_component = '''// StorageGauge.tsx — extracted Sprint 4
import { HardDrive } from "lucide-react";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export { formatTime };

''' + storage_block

open("/root/misfits-web/src/components/dashboard/StorageGauge.tsx", "w").write(storage_component)
print(f"StorageGauge.tsx: {len(storage_component.splitlines())} lines")

# ── 3. Patch page.tsx: replace fixtures with imports, StorageGauge with import
# Remove VEILLE, TASKS, ALERTS constants from page.tsx
new_content = content

# Add imports at top (after last import)
last_import = max(
    new_content.rfind("\nimport ") + 1,
    0
)
# Find end of last import line
end_of_imports = new_content.find("\n", last_import)
end_of_imports = new_content.find("\n\n", end_of_imports)

extra_imports = '''import { VEILLE, TASKS, ALERTS } from "./dashboard-fixtures";
import { StorageGauge, formatTime } from "@/components/dashboard/StorageGauge";
'''

# Find insertion point (after all imports)
import_section_end = 0
for i, l in enumerate(lines):
    if l.startswith("import ") or l.startswith("// "):
        import_section_end = i
    elif import_section_end > 0 and not l.startswith("import ") and l.strip():
        break

# Insert after last import
insert_line = import_section_end + 1
new_lines = lines[:insert_line] + [extra_imports] + lines[insert_line:]

# Remove VEILLE, TASKS, ALERTS blocks
new_lines_str = "".join(new_lines)
if veille_code:
    new_lines_str = new_lines_str.replace(veille_code, "")
if tasks_code:
    new_lines_str = new_lines_str.replace(tasks_code, "")
if alerts_code:
    new_lines_str = new_lines_str.replace(alerts_code, "")

# Remove inline StorageGauge and formatTime functions
new_lines_str = new_lines_str.replace(storage_block, "")

open(page_path, "w").write(new_lines_str)
print(f"dashboard/page.tsx: {len(new_lines_str.splitlines())} lines (was {len(lines)})")
