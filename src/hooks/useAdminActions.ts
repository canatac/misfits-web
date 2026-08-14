"use client";
// useAdminActions.ts — extracted Sprint 6 from admin-console-page.tsx
// CR + user mutations grouped into a single hook.

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  CreateChangeRequestInput,
  CreateAdminUserInput,
  WorkflowStatus,
  AdminUserRecord,
} from "@/types/admin-ops";

type Mutation<T> = { mutateAsync: (payload: T) => Promise<unknown> };

export function useAdminActions(deps: {
  newRequest: CreateChangeRequestInput;
  setNewRequest: Dispatch<SetStateAction<CreateChangeRequestInput>>;
  newAdminUser: CreateAdminUserInput;
  setNewAdminUser: Dispatch<SetStateAction<CreateAdminUserInput>>;
  transitionNote: string;
  deleteDialogTarget: { id: string; title: string } | null;
  setDeleteDialogTarget: Dispatch<SetStateAction<{ id: string; title: string } | null>>;
  qualityScore: number;
  createChangeRequest: Mutation<CreateChangeRequestInput>;
  transitionChangeRequest: Mutation<{
    id: string;
    action:
      | "advance" | "reject" | "stop" | "cancel"
      | "execution_queue" | "execution_start" | "execution_heartbeat"
      | "execution_fail" | "execution_success" | "execution_reset";
    currentStatus: WorkflowStatus;
    note?: string;
    actor: string;
  }>;
  deleteChangeRequest: Mutation<string>;
  startImplementationChangeRequest: Mutation<{
    id: string;
    currentStatus: WorkflowStatus;
    note?: string;
    actor: string;
  }>;
  updateAdminUser: Mutation<{ id: string; role?: AdminUserRecord["role"]; status?: AdminUserRecord["status"] }>;
  createAdminUser: Mutation<CreateAdminUserInput>;
  deleteAdminUser: Mutation<{ id: string }>;
}) {
  const {
    newRequest, setNewRequest,
    newAdminUser, setNewAdminUser,
    transitionNote, deleteDialogTarget, setDeleteDialogTarget,
    qualityScore,
    createChangeRequest, transitionChangeRequest, deleteChangeRequest,
    startImplementationChangeRequest,
    updateAdminUser, createAdminUser, deleteAdminUser,
  } = deps;

  async function handleCreateChangeRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (qualityScore < 4) return;
    await createChangeRequest.mutateAsync(newRequest);
    setNewRequest((prev) => ({ ...prev, title: "", problem: "", desiredOutcome: "" }));
  }

  async function handleTransition(
    id: string,
    action:
      | "advance" | "reject" | "stop" | "cancel"
      | "execution_queue" | "execution_start" | "execution_heartbeat"
      | "execution_fail" | "execution_success" | "execution_reset",
    currentStatus: WorkflowStatus
  ) {
    await transitionChangeRequest.mutateAsync({
      id, action, currentStatus,
      note: transitionNote.trim() || undefined,
      actor: "hermes",
    });
  }

  function openDeleteChangeRequestDialog(id: string, title: string) {
    setDeleteDialogTarget({ id, title });
  }

  async function handleDeleteChangeRequestConfirm() {
    if (!deleteDialogTarget) return;
    await deleteChangeRequest.mutateAsync(deleteDialogTarget.id);
    setDeleteDialogTarget(null);
  }

  async function handleStartImplementation(id: string, currentStatus: WorkflowStatus) {
    await startImplementationChangeRequest.mutateAsync({
      id, currentStatus,
      note: transitionNote.trim() || undefined,
      actor: "hermes",
    });
  }

  async function handleUserRoleChange(id: string, role: AdminUserRecord["role"]) {
    await updateAdminUser.mutateAsync({ id, role });
  }

  async function handleUserStatusChange(id: string, status: AdminUserRecord["status"]) {
    await updateAdminUser.mutateAsync({ id, status });
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newAdminUser.email?.trim() || "";
    if (!email) return;
    await createAdminUser.mutateAsync({
      email,
      displayName: newAdminUser.displayName?.trim() || undefined,
      role: newAdminUser.role,
      status: newAdminUser.status,
      twoFactorEnabled: newAdminUser.twoFactorEnabled,
    });
    setNewAdminUser({
      email: "", displayName: "", role: "user", status: "active", twoFactorEnabled: false,
    });
  }

  async function handleDeleteUser(id: string) {
    const confirmed = window.confirm("Supprimer cet utilisateur du répertoire admin ?");
    if (!confirmed) return;
    await deleteAdminUser.mutateAsync({ id });
  }

  return {
    handleCreateChangeRequest,
    handleTransition,
    openDeleteChangeRequestDialog,
    handleDeleteChangeRequestConfirm,
    handleStartImplementation,
    handleUserRoleChange,
    handleUserStatusChange,
    handleCreateUser,
    handleDeleteUser,
  };
}
