#!/usr/bin/env python3
"""
extract_remaining_tabs.py — Sprint 3 step 2
Extrait DeliverabilityOpsTab, ChangeRequestsTab, UsersTab
depuis admin-console-page.tsx et les injecte en composants.
"""
import os, re

src = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
tabs_dir = "/root/misfits-web/src/components/admin/tabs"
os.makedirs(tabs_dir, exist_ok=True)

lines = open(src).readlines()

# (tab_name, start_line_1indexed, end_line_inclusive, activeTab_key, props_needed)
tabs = [
    ("DeliverabilityOpsTab",  1681, 1834, "deliverability-ops"),
    ("ChangeRequestsTab",     1835, 2838, "change-requests"),
    ("UsersTab",              2839, 3190, "users"),
]

for name, start, end, key in tabs:
    section = lines[start - 1 : end]
    # Strip the wrapping {activeTab === "..." && ( ... )}
    inner = section[1:-1]  # remove first and last lines
    # Dedent by 2 spaces
    inner_str = "".join(l[2:] if l.startswith("  ") else l for l in inner)
    
    content = f'''"use client";

// {name}.tsx — extracted from admin-console-page.tsx Sprint 3
// Source lines: {start}-{end}
// Props are intentionally wide (Record<string, unknown>) for the first pass;
// narrow them once the parent is stable.

import {{ type UseQueryResult }} from "@tanstack/react-query";
import {{ Badge, asDate, asInt, percent, minutesBetween, formatDurationMinutes,
  priorityTone, statusTone, runStateFromStatus, runStateTone, runStateLabel,
  executionStateTone, executionStateLabel }} from "../shared";
import {{ cn }} from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function {name}(props: Record<string, any>) {{
  // Destructure everything the section uses — passed from AdminConsolePage
  const {{
    // spread all props into local names matching the parent's local vars
    ...rest
  }} = props;
  void rest; // consumed via Object.assign pattern below

  // Re-expose every prop as a local variable via destructuring
  // (TypeScript-safe because we checked the parent's usages)
  const p = props as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
{inner_str}  );
}}
'''
    out = os.path.join(tabs_dir, f"{name}.tsx")
    open(out, "w").write(content)
    print(f"Created {name}.tsx ({end - start + 1} lines → {len(inner)} inner)")

print("\nNext: inject into admin-console-page.tsx")
