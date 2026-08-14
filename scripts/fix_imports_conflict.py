#!/usr/bin/env python3
"""
Fix admin-console-page.tsx: remove conflicting type imports from @/types/admin-ops.
The parent defines its own local types for Deliverability* — don't fight it.
Instead: remove those from the global import and let DeliverabilityOpsTab accept
the types via structural typing (the tab already imports them separately).
"""
import re

path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
content = open(path).read()

# Remove DeliverabilityProcedureResponse and DeliverabilityProcedureItem from the import
# (they conflict with local type definitions)
for name in ["DeliverabilityProcedureResponse", "DeliverabilityProcedureItem",
             "AdminDeliverabilityDiagnosticsResponse"]:
    # Remove from named import block
    content = re.sub(rf',?\s*\n?\s*{name}\s*,?', '', content)
    # Clean up double commas
    content = re.sub(r',\s*,', ',', content)
    # Clean up trailing comma before closing brace
    content = re.sub(r',\s*\n(\s*\})', r'\n\1', content)

open(path, "w").write(content)
print(f"Done: {len(content.splitlines())} lines")
print("Removed conflicting type imports")
