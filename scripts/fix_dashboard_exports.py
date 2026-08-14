#!/usr/bin/env python3
"""Fix exports in dashboard-fixtures.ts and StorageGauge.tsx"""

# 1. Add exports to dashboard-fixtures.ts
path = "/root/misfits-web/src/app/dashboard/dashboard-fixtures.ts"
content = open(path).read()
for name in ["VEILLE", "TASKS", "ALERTS"]:
    content = content.replace(f"const {name} = [", f"export const {name} = [")
open(path, "w").write(content)
print(f"dashboard-fixtures.ts: exports added")

# 2. Add exports to StorageGauge.tsx
path2 = "/root/misfits-web/src/components/dashboard/StorageGauge.tsx"
content2 = open(path2).read()
content2 = content2.replace("function formatTime(", "export function formatTime(")
content2 = content2.replace("function StorageGauge(", "export function StorageGauge(")
# Remove the old export at end if any
content2 = content2.replace("\nexport { formatTime };\n", "\n")
open(path2, "w").write(content2)
print(f"StorageGauge.tsx: exports added")
