#!/usr/bin/env python3
"""
Fix all 3 tab component props to use ReturnType<typeof useXxx> pattern.
This avoids manual type declarations that drift from the real hook types.
"""
import re

# ── ChangeRequestsTab ────────────────────────────────────────────────────────
cr_path = "/root/misfits-web/src/components/admin/tabs/ChangeRequestsTab.tsx"
cr_content = open(cr_path).read()

# Replace the props interface with ReturnType-based props
old_imports = '''import type { UseQueryResult } from "@tanstack/react-query";
import type {
  ChangeRequestItem,
  WorkflowStatus,
  ChangeRequestsResponse,
  CreateChangeRequestInput,
} from "@/types/admin-ops";
import { Badge, asDate, priorityTone, statusTone,
  runStateFromStatus, runStateTone, runStateLabel,
  executionStateTone, executionStateLabel } from "../shared";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ChangeRequestsTabProps {
  changeRequests: UseQueryResult<ChangeRequestsResponse, Error>;
  createChangeRequest: { mutate: (input: CreateChangeRequestInput) => void; isPending: boolean };
  deleteChangeRequest: { mutate: (id: string) => void };
  transitionChangeRequest: { mutate: (args: { id: string; status: WorkflowStatus }) => void };
  startImplementation: { mutate: (id: string) => void };
  kanbanColumns: Map<WorkflowStatus, ChangeRequestItem[]>;
  workflowRunMonitoring: { onTrack: number; atRisk: number; blocked: number };
  crForm: CreateChangeRequestInput;
  setCrForm: React.Dispatch<React.SetStateAction<CreateChangeRequestInput>>;
  crGuideInput: string;
  setCrGuideInput: React.Dispatch<React.SetStateAction<string>>;
  crGuideLoading: boolean;
  crGuideError: string | null;
  handleCrGuide: (e: React.FormEvent) => Promise<void>;
  WORKFLOW_STATUS_COLUMNS: WorkflowStatus[];
  STATUS_LABEL: Record<WorkflowStatus, string>;
}'''

new_imports = '''import type { UseQueryResult } from "@tanstack/react-query";
import type {
  ChangeRequestItem,
  WorkflowStatus,
  ChangeRequestsResponse,
  CreateChangeRequestInput,
} from "@/types/admin-ops";
import type {
  useTransitionChangeRequest,
  useStartImplementationChangeRequest,
  useCreateChangeRequest,
  useDeleteChangeRequest,
} from "@/hooks/use-admin-ops";
import { Badge, asDate, priorityTone, statusTone,
  runStateFromStatus, runStateTone, runStateLabel,
  executionStateTone, executionStateLabel } from "../shared";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ChangeRequestsTabProps {
  changeRequests: UseQueryResult<ChangeRequestsResponse, Error>;
  createChangeRequest: ReturnType<typeof useCreateChangeRequest>;
  deleteChangeRequest: ReturnType<typeof useDeleteChangeRequest>;
  transitionChangeRequest: ReturnType<typeof useTransitionChangeRequest>;
  startImplementation: ReturnType<typeof useStartImplementationChangeRequest>;
  kanbanColumns: Map<WorkflowStatus, ChangeRequestItem[]>;
  workflowRunMonitoring: { onTrack: number; atRisk: number; blocked: number };
  crForm: CreateChangeRequestInput;
  setCrForm: React.Dispatch<React.SetStateAction<CreateChangeRequestInput>>;
  crGuideInput: string;
  setCrGuideInput: React.Dispatch<React.SetStateAction<string>>;
  crGuideLoading: boolean;
  crGuideError: string | null;
  handleCrGuide: (e: React.FormEvent) => Promise<void>;
  WORKFLOW_STATUS_COLUMNS: WorkflowStatus[];
  STATUS_LABEL: Record<WorkflowStatus, string>;
  adminDataLoading: boolean;
  adminDataError: string | null;
}'''

if old_imports in cr_content:
    cr_content = cr_content.replace(old_imports, new_imports)
    open(cr_path, 'w').write(cr_content)
    print("ChangeRequestsTab.tsx: updated imports and props interface")
else:
    print("WARN: ChangeRequestsTab old_imports not found, patching manually")
    # Just add the missing imports at the top
    cr_content = cr_content.replace(
        'import { AlertTriangle } from "lucide-react";',
        '''import { AlertTriangle } from "lucide-react";
import type {
  useTransitionChangeRequest,
  useStartImplementationChangeRequest,
  useCreateChangeRequest,
  useDeleteChangeRequest,
} from "@/hooks/use-admin-ops";'''
    )
    # Add missing props
    cr_content = cr_content.replace(
        '  STATUS_LABEL: Record<WorkflowStatus, string>;\n}',
        '  STATUS_LABEL: Record<WorkflowStatus, string>;\n  adminDataLoading: boolean;\n  adminDataError: string | null;\n}'
    )
    open(cr_path, 'w').write(cr_content)
    print("ChangeRequestsTab.tsx: patched")

# ── UsersTab ─────────────────────────────────────────────────────────────────
users_path = "/root/misfits-web/src/components/admin/tabs/UsersTab.tsx"
users_content = open(users_path).read()

# Replace mutation prop types with ReturnType
users_content = users_content.replace(
    '''import type { AdminAuditLogResponse } from "@/lib/admin-ops-api";''',
    '''import type { AdminAuditLogResponse } from "@/lib/admin-ops-api";
import type {
  useUpdateAdminUser,
  useDeleteAdminUser,
  useCreateAdminUser,
  useInviteAdminUser,
  useResetAdminPassword,
} from "@/hooks/use-admin-ops";'''
)

users_content = re.sub(
    r'createAdminUser: \{[^}]+\};',
    'createAdminUser: ReturnType<typeof useCreateAdminUser>;',
    users_content
)
users_content = re.sub(
    r'inviteAdminUser: \{[^}]+\};',
    'inviteAdminUser: ReturnType<typeof useInviteAdminUser>;',
    users_content
)
users_content = re.sub(
    r'resetAdminPassword: \{[^\}]+\};',
    'resetAdminPassword: ReturnType<typeof useResetAdminPassword>;',
    users_content
)
users_content = re.sub(
    r'deleteAdminUser: \{[^}]+\};',
    'deleteAdminUser: ReturnType<typeof useDeleteAdminUser>;',
    users_content
)
users_content = re.sub(
    r'updateAdminUser: \{[^}]+\};',
    'updateAdminUser: ReturnType<typeof useUpdateAdminUser>;',
    users_content
)

open(users_path, 'w').write(users_content)
print("UsersTab.tsx: updated mutation prop types to ReturnType<>")

print("\nDone. Check hooks for exact function exports.")
