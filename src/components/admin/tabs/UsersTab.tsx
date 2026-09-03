"use client";

// UsersTab.tsx — extracted from admin-console-page.tsx Sprint 3
import { useMemo, useState, type FormEvent } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  AdminUserRecord,
  AdminUsersResponse,
  AdminWhoamiResponse,
  CreateAdminUserInput,
  AdminAiActivityResponse,
} from "@/types/admin-ops";
import type { AdminAuditLogResponse } from "@/lib/admin-ops-api";
import type {
  useUpdateAdminUser,
  useDeleteAdminUser,
  useCreateAdminUser,
  useInviteAdminUser,
  useResetAdminPassword,
} from "@/hooks/use-admin-ops";
import { Badge, asDate, asInt } from "../shared";
import { UsersAiActivityCard, UsersAuditLogCard } from "./users/UsersAuxCards";
import { UsersCreateForm } from "./users/UsersCreateForm";
import { UserListItem } from "./users/UserListItem";
import {
  UserActivityModal,
  UserDeleteModal,
  UserResetPasswordModal,
} from "./users/UserManagementModals";

interface UsersTabProps {
  adminUsers: UseQueryResult<AdminUsersResponse, Error>;
  adminWhoami: UseQueryResult<AdminWhoamiResponse & { enforced?: boolean }, Error>;
  adminAiActivity: UseQueryResult<AdminAiActivityResponse, Error>;
  adminAuditLog: UseQueryResult<AdminAuditLogResponse, Error>;
  createAdminUser: ReturnType<typeof useCreateAdminUser>;
  inviteAdminUser: ReturnType<typeof useInviteAdminUser>;
  resetAdminPassword: ReturnType<typeof useResetAdminPassword>;
  deleteAdminUser: ReturnType<typeof useDeleteAdminUser>;
  updateAdminUser: ReturnType<typeof useUpdateAdminUser>;
}

export function UsersTab({
  adminUsers,
  adminWhoami,
  adminAiActivity,
  adminAuditLog,
  createAdminUser,
  inviteAdminUser,
  resetAdminPassword,
  deleteAdminUser,
  updateAdminUser,
}: UsersTabProps) {
  const rbacEnforced = adminWhoami.data?.enforced === true;
  const canWriteUsers = (adminWhoami.data?.role ?? "admin") === "admin";

  const [newAdminUser, setNewAdminUser] = useState<CreateAdminUserInput>({
    email: "",
    role: "user",
    status: "active",
    displayName: "",
  });
  const [userDrafts, setUserDrafts] = useState<
    Record<string, Pick<AdminUserRecord, "role" | "status">>
  >({});
  const [deleteDialogTarget, setDeleteDialogTarget] =
    useState<AdminUserRecord | null>(null);
  const [resetDialogTarget, setResetDialogTarget] =
    useState<AdminUserRecord | null>(null);
  const [activityDialogTarget, setActivityDialogTarget] =
    useState<AdminUserRecord | null>(null);
  const [resetPasswordDraft, setResetPasswordDraft] = useState("");
  const [resetRevokeSessions, setResetRevokeSessions] = useState(true);

  function userDraftFor(user: AdminUserRecord) {
    return userDrafts[user.id] ?? { role: user.role, status: user.status };
  }

  function setUserDraftRole(id: string, role: AdminUserRecord["role"]) {
    setUserDrafts((prev) => {
      const current = prev[id] ?? { role: "user" as const, status: "active" as const };
      return {
        ...prev,
        [id]: {
          ...current,
          role,
        },
      };
    });
  }

  function setUserDraftStatus(id: string, status: AdminUserRecord["status"]) {
    setUserDrafts((prev) => {
      const current = prev[id] ?? { role: "user" as const, status: "active" as const };
      return {
        ...prev,
        [id]: {
          ...current,
          status,
        },
      };
    });
  }

  async function handleSaveUser(user: AdminUserRecord) {
    const draft = userDraftFor(user);
    await updateAdminUser.mutateAsync({
      id: user.id,
      role: draft.role,
      status: draft.status,
    });
    setUserDrafts((prev) => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });
  }

  async function handleDeleteUserConfirm() {
    if (!deleteDialogTarget) return;
    await deleteAdminUser.mutateAsync({ id: deleteDialogTarget.id });
    setDeleteDialogTarget(null);
  }

  async function handleResetPasswordConfirm() {
    if (!resetDialogTarget) return;
    const cleanPassword = resetPasswordDraft.trim();
    await resetAdminPassword.mutateAsync({
      id: resetDialogTarget.id,
      newPassword: cleanPassword || undefined,
      revokeSessions: resetRevokeSessions,
    });
    setResetDialogTarget(null);
    setResetPasswordDraft("");
    setResetRevokeSessions(true);
  }

  function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createAdminUser.mutate({
      ...newAdminUser,
      displayName: newAdminUser.displayName?.trim() || undefined,
    });
    setNewAdminUser({ email: "", role: "user", status: "active", displayName: "" });
  }

  const selectedUserAuditEntries = useMemo(() => {
    if (!activityDialogTarget) return [];
    const userId = activityDialogTarget.id;
    const userEmail = activityDialogTarget.email.toLowerCase();
    return (adminAuditLog.data?.entries ?? [])
      .filter((entry) => {
        const targetId = entry.targetId?.toLowerCase?.() ?? "";
        const actorEmail = entry.actorEmail?.toLowerCase?.() ?? "";
        return (
          targetId === userId.toLowerCase() ||
          targetId === userEmail ||
          actorEmail === userEmail
        );
      })
      .slice(0, 25);
  }, [activityDialogTarget, adminAuditLog.data?.entries]);

  return (
    <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#E4E4E7]">
              Gestion des utilisateurs
            </h2>
            <p className="mt-1 text-xs text-[#71717A]">
              Pilotage des rôles et activité opérationnelle récente.
            </p>
          </div>
          <Badge tone={adminUsers.isFetching ? "warn" : "ok"}>
            {adminUsers.isFetching ? "syncing" : "live"}
          </Badge>
        </div>

        {rbacEnforced && !canWriteUsers && (
          <div className="mb-4 rounded-xl border border-[#5B4A1F] bg-[#2A2513] p-3">
            <p className="text-xs font-medium text-[#F5C563]">
              Lecture seule — rôle: {adminWhoami.data?.role ?? "viewer"}
            </p>
            <p className="mt-1 text-[11px] text-[#D4D4D8]">
              Vous consultez la liste des utilisateurs. Les actions création,
              modification et suppression sont réservées au rôle admin.
            </p>
          </div>
        )}

        <div className="mb-4 rounded-xl border border-[#2A2A30] bg-[#151518] p-3">
          <p className="text-xs font-medium text-[#E4E4E7]">Mode d&apos;emploi rapide</p>
          <ul className="mt-2 space-y-1 text-xs text-[#A1A1AA]">
            <li>1. Créer: remplir le formulaire “Créer un utilisateur”, puis “Créer”.</li>
            <li>2. Mettre à jour: modifier rôle/statut puis cliquer “Enregistrer”.</li>
            <li>3. Supprimer: cliquer “Supprimer”, confirmer dans la modale.</li>
            <li>4. Activité: cliquer “Voir activité” pour le détail timeline + audit.</li>
          </ul>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
            <p className="text-xs text-[#A1A1AA]">Utilisateurs</p>
            <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
              {asInt(adminUsers.data?.users.length ?? 0)}
            </p>
          </article>
          <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
            <p className="text-xs text-[#A1A1AA]">Admins</p>
            <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
              {asInt((adminUsers.data?.users ?? []).filter((u) => u.role === "admin").length)}
            </p>
          </article>
          <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
            <p className="text-xs text-[#A1A1AA]">Support</p>
            <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
              {asInt((adminUsers.data?.users ?? []).filter((u) => u.role === "support").length)}
            </p>
          </article>
          <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
            <p className="text-xs text-[#A1A1AA]">2FA activée</p>
            <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
              {asInt((adminUsers.data?.users ?? []).filter((u) => u.twoFactorEnabled).length)}
            </p>
          </article>
        </div>

        {canWriteUsers && (
        <UsersCreateForm
          newAdminUser={newAdminUser}
          setNewAdminUser={setNewAdminUser}
          isPending={createAdminUser.isPending}
          onSubmit={(e) => void handleCreateUser(e)}
        />
        )}

        <UsersAiActivityCard adminAiActivity={adminAiActivity} />

        <div className="space-y-3">
          {(adminUsers.data?.users ?? []).map((user) => (
            <UserListItem
              key={user.id}
              user={user}
              draft={userDraftFor(user)}
              canWriteUsers={canWriteUsers}
              updatePending={updateAdminUser.isPending}
              invitePending={inviteAdminUser.isPending}
              resetPending={resetAdminPassword.isPending}
              deletePending={deleteAdminUser.isPending}
              onDraftStatusChange={setUserDraftStatus}
              onDraftRoleChange={setUserDraftRole}
              onSave={(target) => void handleSaveUser(target)}
              onOpenActivity={setActivityDialogTarget}
              onInvite={(id) => inviteAdminUser.mutate(id)}
              onOpenReset={(target) => {
                setResetDialogTarget(target);
                setResetPasswordDraft("");
                setResetRevokeSessions(true);
              }}
              onOpenDelete={setDeleteDialogTarget}
            />
          ))}

          {adminUsers.isError && (
            <p className="text-sm text-[#FCA5A5]">Erreur users: {adminUsers.error.message}</p>
          )}
          {adminAiActivity.isError && (
            <p className="text-sm text-[#FCA5A5]">Erreur activité IA: {adminAiActivity.error.message}</p>
          )}

          <UsersAuditLogCard adminAuditLog={adminAuditLog} />
        </div>

        <UserDeleteModal
          target={deleteDialogTarget}
          isPending={deleteAdminUser.isPending}
          onClose={() => setDeleteDialogTarget(null)}
          onConfirm={() => void handleDeleteUserConfirm()}
        />

        <UserResetPasswordModal
          target={resetDialogTarget}
          passwordDraft={resetPasswordDraft}
          revokeSessions={resetRevokeSessions}
          isPending={resetAdminPassword.isPending}
          onChangePasswordDraft={setResetPasswordDraft}
          onChangeRevokeSessions={setResetRevokeSessions}
          onClose={() => {
            setResetDialogTarget(null);
            setResetPasswordDraft("");
            setResetRevokeSessions(true);
          }}
          onConfirm={() => void handleResetPasswordConfirm()}
        />

        <UserActivityModal
          target={activityDialogTarget}
          linkedAuditEntries={selectedUserAuditEntries}
          onClose={() => setActivityDialogTarget(null)}
        />
    </section>
  );
}
