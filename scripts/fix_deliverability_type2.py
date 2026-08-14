#!/usr/bin/env python3
"""
Remove the local DeliverabilityProcedureResponse type from admin-console-page.tsx
and import it from @/types/admin-ops instead.
"""
import re

path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
content = open(path).read()

# 1. Remove the local type definition (multi-line)
local_type_pattern = r"type DeliverabilityProcedureData = \{[^}]+\};\n\n"
match = re.search(local_type_pattern, content, re.DOTALL)
if match:
    content = content[:match.start()] + content[match.end():]
    print(f"Removed local type ({len(match.group())} chars)")
else:
    # Try the renamed version
    local_type_pattern2 = r"type DeliverabilityProcedureData = \{.*?\};\n"
    match2 = re.search(local_type_pattern2, content, re.DOTALL)
    if match2:
        content = content[:match2.start()] + content[match2.end():]
        print(f"Removed local type (alt pattern, {len(match2.group())} chars)")
    else:
        print("WARN: local type not found")

# 2. Revert rename in useState
content = content.replace(
    "useState<DeliverabilityProcedureData | null>(null)",
    "useState<DeliverabilityProcedureResponse | null>(null)"
)

# 3. Ensure DeliverabilityProcedureResponse is imported from @/types/admin-ops
if "DeliverabilityProcedureResponse" not in content.split("import")[0] + "".join(
    line for line in content.split("\n") if line.startswith("import")
):
    # Find the import from @/types/admin-ops
    import_match = re.search(r'import type \{([^}]+)\} from "@/types/admin-ops"', content)
    if import_match:
        existing = import_match.group(1)
        if "DeliverabilityProcedureResponse" not in existing:
            new_import = f'import type {{{existing},\n  DeliverabilityProcedureResponse\n}} from "@/types/admin-ops"'
            content = content.replace(import_match.group(0), new_import)
            print("Added DeliverabilityProcedureResponse to @/types/admin-ops import")
else:
    print("DeliverabilityProcedureResponse already in imports")

open(path, "w").write(content)
print(f"Done: {len(content.splitlines())} lines")
