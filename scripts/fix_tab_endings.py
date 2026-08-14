#!/usr/bin/env python3
"""Fix broken endings in extracted tab components."""

def fix_tab(path, stop_marker):
    """Truncate file at stop_marker (exclusive) and add proper closing."""
    lines = open(path).readlines()
    # Find first occurrence of stop_marker
    cut = None
    for i, l in enumerate(lines):
        if stop_marker in l:
            cut = i
            break
    if cut is None:
        print(f"WARN: stop_marker not found in {path}")
        return
    lines = lines[:cut]
    # Ensure proper closing: </section> + ); + }
    # Check if already ends with </section>
    last = "".join(lines[-4:])
    if '</section>' not in last:
        lines.append('        </section>\n')
    lines.append('  );\n')
    lines.append('}\n')
    open(path, 'w').writelines(lines)
    print(f"Fixed {path}: {len(lines)} lines")

fix_tab(
    "/root/misfits-web/src/components/admin/tabs/DeliverabilityOpsTab.tsx",
    stop_marker='      )}\n'  # closing of {activeTab === "deliverability-ops" && (
)
fix_tab(
    "/root/misfits-web/src/components/admin/tabs/ChangeRequestsTab.tsx",
    stop_marker='  );\n'  # the orphan ); before </section>
)
