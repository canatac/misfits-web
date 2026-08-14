#!/usr/bin/env python3
"""Add explicit types to dashboard-fixtures.ts and fix implicit any in page.tsx"""

# Add 'as const' to arrays in fixtures to preserve literal types
path = "/root/misfits-web/src/app/dashboard/dashboard-fixtures.ts"
content = open(path).read()

# Add type annotations for arrays
header = '''// dashboard-fixtures.ts
// TODO Sprint 5: Replace with real API calls
// These are placeholder data for UI development

export interface VeilleItem {
  id: string; title: string; signal: number; tags: string[];
  summary: string; takeaways?: string[];
}
export interface TaskItem {
  id: string; label: string; due: string; priority: "high" | "medium" | "low";
}
export interface AlertItem {
  id: string; title: string; description: string; time: string; cta: string;
}
'''

# Remove existing comment header
import re
content = re.sub(r'^// dashboard-fixtures\.ts\n// .*\n// .*\n\n', '', content)
content = header + content

# Add explicit types to exports
content = content.replace("export const VEILLE = [", "export const VEILLE: VeilleItem[] = [")
content = content.replace("export const TASKS = [", "export const TASKS: TaskItem[] = [")
content = content.replace("export const ALERTS = [", "export const ALERTS: AlertItem[] = [")

open(path, "w").write(content)
print(f"dashboard-fixtures.ts: typed")

# Fix implicit any callbacks in page.tsx
page = "/root/misfits-web/src/app/dashboard/page.tsx"
pg = open(page).read()

# Add imports of types
if "VeilleItem" not in pg:
    pg = pg.replace(
        'import { VEILLE, TASKS, ALERTS } from "./dashboard-fixtures";',
        'import { VEILLE, TASKS, ALERTS, type VeilleItem, type TaskItem, type AlertItem } from "./dashboard-fixtures";'
    )

open(page, "w").write(pg)
print("page.tsx: types imported")
