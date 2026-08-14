#!/usr/bin/env python3
"""
create_tabs.py — crée les 3 composants tab en extrayant le JSX de admin-console-page.tsx
et en injectant les appels dans le parent.
"""
import os

src = "/root/misfits-web/src/components/admin/admin-console-page.tsx"
tabs_dir = "/root/misfits-web/src/components/admin/tabs"
os.makedirs(tabs_dir, exist_ok=True)

lines = open(src).readlines()

def extract_jsx(start_1idx, end_1idx):
    """Extract inner JSX (strip outer conditional wrapper)."""
    section = lines[start_1idx - 1 : end_1idx]
    # First line: {activeTab === "..." && (
    # Second line: <section ...>
    # Last-2: )
    # Last-1: )}
    inner = section[1:-2]  # keep from <section> to </section>
    return "".join(inner)

# ── DeliverabilityOpsTab (L1682-1833) ─────────────────────────────────────────
deliv_jsx = extract_jsx(1682, 1833)

deliv_content = '''"use client";

// DeliverabilityOpsTab.tsx — extracted Sprint 3
import type { DeliverabilityProcedureResponse, AdminDeliverabilityDiagnosticsResponse } from "@/types/admin-ops";
import { Badge, asDate, asInt } from "../shared";

interface DeliverabilityOpsTabProps {
  procedureSaving: boolean;
  deliverabilityProcedure: DeliverabilityProcedureResponse | null;
  deliverability: AdminDeliverabilityDiagnosticsResponse | null;
  saveProcedureUpdate: (patch: Partial<DeliverabilityProcedureResponse>) => Promise<void>;
}

export function DeliverabilityOpsTab({
  procedureSaving,
  deliverabilityProcedure,
  deliverability,
  saveProcedureUpdate,
}: DeliverabilityOpsTabProps) {
  return (
''' + deliv_jsx + '''  );
}
'''

open(os.path.join(tabs_dir, "DeliverabilityOpsTab.tsx"), "w").write(deliv_content)
print(f"DeliverabilityOpsTab.tsx: {len(deliv_jsx.splitlines())} JSX lines")

# ── ChangeRequestsTab (L1836-2837) ────────────────────────────────────────────
cr_jsx = extract_jsx(1836, 2837)

cr_content = '''"use client";

// ChangeRequestsTab.tsx — extracted Sprint 3
import type { UseQueryResult } from "@tanstack/react-query";
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
}

export function ChangeRequestsTab({
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
}: ChangeRequestsTabProps) {
  return (
''' + cr_jsx + '''  );
}
'''

open(os.path.join(tabs_dir, "ChangeRequestsTab.tsx"), "w").write(cr_content)
print(f"ChangeRequestsTab.tsx: {len(cr_jsx.splitlines())} JSX lines")

# ── UsersTab (L2840-3189) ─────────────────────────────────────────────────────
users_jsx = extract_jsx(2840, 3189)

users_content = '''"use client";

// UsersTab.tsx — extracted Sprint 3
import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  AdminUserRecord,
  AdminUsersResponse,
  AdminWhoamiResponse,
  CreateAdminUserInput,
} from "@/types/admin-ops";
import { Badge, asDate, asInt } from "../shared";

interface UsersTabProps {
  adminUsers: UseQueryResult<AdminUsersResponse, Error>;
  adminWhoami: UseQueryResult<AdminWhoamiResponse, Error>;
  createUser: { mutate: (input: CreateAdminUserInput) => void; isPending: boolean };
  inviteUser: { mutate: (email: string) => void };
  resetPassword: { mutate: (userId: string) => void };
  deleteUser: { mutate: (userId: string) => void };
  adminAuditLog: UseQueryResult<{ entries: unknown[] }, Error>;
}

export function UsersTab({
  adminUsers,
  adminWhoami,
  createUser,
  inviteUser,
  resetPassword,
  deleteUser,
  adminAuditLog,
}: UsersTabProps) {
  const [newUserForm, setNewUserForm] = useState<CreateAdminUserInput>({
    email: "",
    password: "",
    role: "viewer",
    display_name: "",
  });

  return (
''' + users_jsx + '''  );
}
'''

open(os.path.join(tabs_dir, "UsersTab.tsx"), "w").write(users_content)
print(f"UsersTab.tsx: {len(users_jsx.splitlines())} JSX lines")

print("\nAll 3 tabs created. Next: inject into admin-console-page.tsx")
