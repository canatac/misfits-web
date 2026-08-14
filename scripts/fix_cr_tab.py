#!/usr/bin/env python3
"""Final fix for ChangeRequestsTab: clean up props interface and destructuring."""
import re

path = "/root/misfits-web/src/components/admin/tabs/ChangeRequestsTab.tsx"
content = open(path).read()

# 1. Fix the interface — remove invented props
old_iface = """interface ChangeRequestsTabProps {
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
}"""

new_iface = """interface ChangeRequestsTabProps {
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
  handleCrGuide: (e: React.FormEvent) => void;
}"""

content = content.replace(old_iface, new_iface)

# 2. Fix the destructuring — remove locally-computed vars
old_destruct = """export function ChangeRequestsTab({
  changeRequests,
  createChangeRequest,
  deleteChangeRequest,
  transitionChangeRequest,
  startImplementation,
  kanbanColumns,
  workflowRunMonitoring,
  crForm,
  setCrForm,
  crGuideInput,
  setCrGuideInput,
  crGuideLoading,
  crGuideError,
  handleCrGuide,
  WORKFLOW_STATUS_COLUMNS,
  STATUS_LABEL,
}: ChangeRequestsTabProps) {"""

new_destruct = """export function ChangeRequestsTab({
  changeRequests,
  createChangeRequest,
  deleteChangeRequest,
  transitionChangeRequest,
  startImplementation,
  adminDataLoading,
  adminDataError,
  crGuideInput,
  setCrGuideInput,
  crGuideLoading,
  crGuideError,
  handleCrGuide,
}: ChangeRequestsTabProps) {"""

if old_destruct in content:
    content = content.replace(old_destruct, new_destruct)
    print("Fixed destructuring")
else:
    print("WARN: old_destruct not found, trying partial fix")
    # Remove the props that are now computed locally
    for prop in ["  kanbanColumns,\n", "  workflowRunMonitoring,\n", "  crForm,\n",
                 "  setCrForm,\n", "  WORKFLOW_STATUS_COLUMNS,\n", "  STATUS_LABEL,\n"]:
        content = content.replace(prop, "")
    # And rename adminDataLoading to be included
    content = content.replace("  startImplementation,\n}: ChangeRequestsTabProps) {",
                               "  startImplementation,\n  adminDataLoading,\n  adminDataError,\n"
                               "  crGuideInput,\n  setCrGuideInput,\n  crGuideLoading,\n"
                               "  crGuideError,\n  handleCrGuide,\n}: ChangeRequestsTabProps) {")
    print("Fixed via partial patch")

open(path, "w").write(content)
print(f"ChangeRequestsTab.tsx: {len(content.splitlines())} lines")
