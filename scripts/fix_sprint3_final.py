#!/usr/bin/env python3
"""
Final fix for Sprint 3 tab extraction:
1. ChangeRequestsTab: remove invented props, add workflowRunMonitoring useMemo internally
2. UsersTab: fix mutation prop types  
3. admin-console-page.tsx: fix call sites
"""
import subprocess

orig_lines = subprocess.run(
    ['git', 'show', 'master~2:src/components/admin/admin-console-page.tsx'],
    capture_output=True, text=True, cwd='/root/misfits-web'
).stdout.splitlines(keepends=True)

# Extract workflowRunMonitoring useMemo block from original
wf_start = None
for i, l in enumerate(orig_lines):
    if 'const workflowRunMonitoring = useMemo' in l:
        wf_start = i
        break

# Extract until end of useMemo (depth 0)
depth = 0
wf_block = []
for l in orig_lines[wf_start:]:
    wf_block.append(l)
    for ch in l:
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
    if depth == 0 and len(wf_block) > 1:
        break

print(f"workflowRunMonitoring block: {len(wf_block)} lines")

# ── Rewrite ChangeRequestsTab.tsx ─────────────────────────────────────────
cr_path = '/root/misfits-web/src/components/admin/tabs/ChangeRequestsTab.tsx'
cr_content = open(cr_path).read()

# New header with minimal, real props
new_header = '''"use client";

// ChangeRequestsTab.tsx — extracted Sprint 3
import { useMemo, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  ChangeRequestItem,
  WorkflowStatus,
  ChangeRequestsResponse,
  ChangeRequestGuideDraft,
} from "@/types/admin-ops";
import type {
  useTransitionChangeRequest,
  useStartImplementationChangeRequest,
  useCreateChangeRequest,
  useDeleteChangeRequest,
} from "@/hooks/use-admin-ops";
import { Badge, asDate, priorityTone, statusTone,
  runStateFromStatus, runStateTone, runStateLabel,
  executionStateTone, executionStateLabel, minutesBetween } from "../shared";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const WORKFLOW_STATUS_COLUMNS: WorkflowStatus[] = [
  "draft", "review", "approved", "in_progress", "done", "rejected",
];
const STATUS_LABEL: Record<WorkflowStatus, string> = {
  draft: "Brouillon", review: "En revue", approved: "Approuvé",
  in_progress: "En cours", done: "Terminé", rejected: "Rejeté",
};

interface ChangeRequestsTabProps {
  changeRequests: UseQueryResult<ChangeRequestsResponse, Error>;
  createChangeRequest: ReturnType<typeof useCreateChangeRequest>;
  deleteChangeRequest: ReturnType<typeof useDeleteChangeRequest>;
  transitionChangeRequest: ReturnType<typeof useTransitionChangeRequest>;
  startImplementation: ReturnType<typeof useStartImplementationChangeRequest>;
  adminDataLoading: boolean;
  adminDataError: string | null;
  crGuideInput: string;
  setCrGuideInput: React.Dispatch<React.SetStateAction<string>>;
  crGuideLoading: boolean;
  crGuideError: string | null;
  handleCrGuide: (e: React.FormEvent) => Promise<void>;
}

'''

# Find where the function definition starts in current file
func_start = cr_content.find('export function ChangeRequestsTab(')
if func_start == -1:
    print("ERROR: function not found in ChangeRequestsTab.tsx")
    exit(1)

# Find the opening { of the function body
body_start = cr_content.index(') {', func_start) + 3

# Insert workflowRunMonitoring + kanbanColumns useMemo in function body
wf_code = ''.join(wf_block)

internal_memos = '''
  const kanbanColumns = useMemo(() => {
    const cols = new Map<WorkflowStatus, ChangeRequestItem[]>();
    WORKFLOW_STATUS_COLUMNS.forEach((s) => cols.set(s, []));
    for (const item of changeRequests.data?.items ?? []) {
      const col = cols.get(item.status as WorkflowStatus);
      if (col) col.push(item);
    }
    return cols;
  }, [changeRequests.data?.items]);

''' + wf_code + '''
  const [crForm, setCrForm] = useState({
    title: "", description: "", priority: "medium" as const, tags: [] as string[],
  });

'''

func_sig_end = cr_content.find('\n', body_start)
new_content = (
    new_header +
    cr_content[func_start : body_start + 1] +
    internal_memos +
    cr_content[body_start + 1:]
)

open(cr_path, 'w').write(new_content)
print(f"ChangeRequestsTab.tsx: {len(new_content.splitlines())} lines")

# ── Fix admin-console-page.tsx call site ─────────────────────────────────
main_path = '/root/misfits-web/src/components/admin/admin-console-page.tsx'
main = open(main_path).read()

# Replace the ChangeRequestsTab call with correct props
old_call = '''      {activeTab === "change-requests" && (
        <ChangeRequestsTab
          changeRequests={changeRequests}
          createChangeRequest={createChangeRequest}
          deleteChangeRequest={deleteChangeRequest}
          transitionChangeRequest={transitionChangeRequest}
          startImplementation={startImplementationChangeRequest}
          kanbanColumns={kanbanColumns}
          workflowRunMonitoring={workflowRunMonitoring}
          crForm={crForm}
          setCrForm={setCrForm}
          crGuideInput={crGuideInput}
          setCrGuideInput={setCrGuideInput}
          crGuideLoading={crGuideLoading}
          crGuideError={crGuideError}
          handleCrGuide={handleCrGuide}
          WORKFLOW_STATUS_COLUMNS={WORKFLOW_STATUS_COLUMNS}
          STATUS_LABEL={STATUS_LABEL}
        />
      )}'''

new_call = '''      {activeTab === "change-requests" && (
        <ChangeRequestsTab
          changeRequests={changeRequests}
          createChangeRequest={createChangeRequest}
          deleteChangeRequest={deleteChangeRequest}
          transitionChangeRequest={transitionChangeRequest}
          startImplementation={startImplementationChangeRequest}
          adminDataLoading={adminDataLoading}
          adminDataError={adminDataError}
          crGuideInput={crGuideInput}
          setCrGuideInput={setCrGuideInput}
          crGuideLoading={crGuideLoading}
          crGuideError={crGuideError}
          handleCrGuide={handleCrGuide}
        />
      )}'''

if old_call in main:
    main = main.replace(old_call, new_call)
    open(main_path, 'w').write(main)
    print("admin-console-page.tsx: updated ChangeRequestsTab call")
else:
    print("WARN: old call not found, trying flexible match")
    # Just find and replace the whole activeTab === "change-requests" block
    import re
    pattern = r'\{activeTab === "change-requests" && \([^}]+\}\s*\)\}'
    if re.search(pattern, main, re.DOTALL):
        main = re.sub(pattern, new_call, main, flags=re.DOTALL)
        open(main_path, 'w').write(main)
        print("admin-console-page.tsx: replaced via regex")
    else:
        print("ERROR: could not find ChangeRequestsTab call in main")
