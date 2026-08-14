#!/usr/bin/env python3
"""Fix JSX structure in extracted tab components."""
import re

# ── DeliverabilityOpsTab ────────────────────────────────────────────────────
path = "/root/misfits-web/src/components/admin/tabs/DeliverabilityOpsTab.tsx"
content = open(path).read()
# Wrap return body in <section>
content = content.replace(
    '  return (\n',
    '  return (\n    <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">\n'
)
content = content.rstrip().rstrip('}')
content = content.rstrip()
content += '\n    </section>\n  );\n}\n'
open(path, 'w').write(content)
print("Fixed DeliverabilityOpsTab.tsx")

# ── ChangeRequestsTab ────────────────────────────────────────────────────────
path = "/root/misfits-web/src/components/admin/tabs/ChangeRequestsTab.tsx"
content = open(path).read()
content = content.replace(
    '  return (\n',
    '  return (\n    <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">\n'
)
content = content.rstrip().rstrip('}')
content = content.rstrip()
content += '\n    </section>\n  );\n}\n'
open(path, 'w').write(content)
print("Fixed ChangeRequestsTab.tsx")

# ── admin-console-page.tsx: fix stray }) ───────────────────────────────────
path = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
lines = open(path).readlines()
# Find "  );" pattern near end after last UsersTab closing
last = "".join(lines[-8:])
print("Last 8 lines:", repr(last))
