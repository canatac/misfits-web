#!/usr/bin/env python3
"""
Fix the DeliverabilityProcedureResponse type conflict.
Strategy: rename the local type in admin-console-page.tsx to avoid shadowing the global one.
"""
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
content = open(path).read()

# Rename local type to avoid conflict
content = content.replace(
    "type DeliverabilityProcedureResponse = {",
    "type DeliverabilityProcedureData = {"
)
# Update all usages of the local type in this file
content = content.replace(
    "useState<DeliverabilityProcedureResponse | null>(null)",
    "useState<DeliverabilityProcedureData | null>(null)"
)

open(path, "w").write(content)
print("Renamed DeliverabilityProcedureResponse → DeliverabilityProcedureData in admin-console-page.tsx")
print(f"Lines: {len(content.splitlines())}")
