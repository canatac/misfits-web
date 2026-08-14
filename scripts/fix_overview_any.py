#!/usr/bin/env python3
"""Fix remaining implicit any in map callbacks in AdminOverviewSections.tsx"""
import re
path = "/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx"
content = open(path).read()

# Fix patterns: .map((x) => ...) where x is from proactive_alerting data
content = content.replace(
    ".map((x) => `${x.ip",
    ".map((x: { ip?: string; attempts?: number }) => `${x.ip"
)
content = content.replace(
    ".map((bounce) => (",
    ".map((bounce: Record<string, unknown>) => ("
)
content = content.replace(
    ".map((incident) => (",
    ".map((incident: Record<string, unknown>) => ("
)
content = content.replace(
    ".slice(0, 10).map((alert) => (",
    ".slice(0, 10).map((alert: Record<string, unknown>) => ("
)

open(path, "w").write(content)
print(f"Done: {len(content.splitlines())} lines")
