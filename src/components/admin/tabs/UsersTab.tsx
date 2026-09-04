"use client";

// UsersTab.tsx — extracted from admin-console-page.tsx Sprint 3
import { useMemo, useState, type FormEvent } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AdminUserRecord,
  AdminUsersResponse,
  AdminWhoamiResponse,
  CreateAdminUserInput,
  AdminAiActivityResponse,
} from "@/types/admin-ops";
import { useAuthStore } from "@/stores/auth-store";
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
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";

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
  const authUser = useAuthStore((s) => s.user);
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
  const [selfPasswordDraft, setSelfPasswordDraft] = useState("");
  const [selfConfirmPasswordDraft, setSelfConfirmPasswordDraft] = useState("");
  const [selfRevokeSessions, setSelfRevokeSessions] = useState(true);

  const currentUser = useMemo(() => {
    const users = adminUsers.data?.users ?? [];
    if (authUser?.id) {
      const byAuthId = users.find((user) => user.id === authUser.id);
      if (byAuthId) return byAuthId;
    }
    if (authUser?.email) {
      const authEmail = authUser.email.toLowerCase();
      const byAuthEmail = users.find((user) => user.email.toLowerCase() === authEmail);
      if (byAuthEmail) return byAuthEmail;
    }

    const whoami = adminWhoami.data;
    if (!whoami) return null;

    if (whoami.userId) {
      const byId = users.find((user) => user.id === whoami.userId);
      if (byId) return byId;
    }

    if (!whoami.email) return null;
    const targetEmail = whoami.email.toLowerCase();
    return users.find((user) => user.email.toLowerCase() === targetEmail) ?? null;
  }, [adminUsers.data?.users, adminWhoami.data, authUser?.email, authUser?.id]);

  const selfPasswordTooShort =
    selfPasswordDraft.length > 0 && selfPasswordDraft.trim().length < 8;
  const selfPasswordMismatch =
    selfConfirmPasswordDraft.length > 0 &&
    selfPasswordDraft.trim() !== selfConfirmPasswordDraft.trim();
  const effectiveCurrentUserId =
    authUser?.id ??
    adminWhoami.data?.userId ??
    currentUser?.id ??
    authUser?.email?.trim() ??
    adminWhoami.data?.email?.trim() ??
    null;

  const canSubmitSelfPassword =
    selfPasswordDraft.trim().length >= 8 &&
    selfPasswordDraft.trim() === selfConfirmPasswordDraft.trim();

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

  async function handleSelfPasswordChange() {
    if (!canSubmitSelfPassword) return;
    if (!effectiveCurrentUserId) {
      toast.error("Impossible d'identifier le compte courant. Utiliser le flux “Mot de passe oublié”.");
      return;
    }
    await resetAdminPassword.mutateAsync({
      id: effectiveCurrentUserId,
      newPassword: selfPasswordDraft.trim(),
      revokeSessions: selfRevokeSessions,
    });
    setSelfPasswordDraft("");
    setSelfConfirmPasswordDraft("");
    setSelfRevokeSessions(true);
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

        <div className="mb-4 rounded-xl border border-[#2A2A30] bg-[#151518] p-3">
          <p className="text-xs font-medium text-[#E4E4E7]">Modifier mon mot de passe</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">
            Accessible à tous les utilisateurs, y compris admin.
          </p>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-[#A1A1AA]">Nouveau mot de passe</span>
              <input
                type="password"
                value={selfPasswordDraft}
                onChange={(event) => setSelfPasswordDraft(event.target.value)}
                className="w-full rounded-md border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
                placeholder="8 caractères minimum"
                autoComplete="new-password"
              />
              <PasswordStrengthIndicator password={selfPasswordDraft} />
              {selfPasswordTooShort && (
                <p className="mt-1 text-[11px] text-[#FCA5A5]">Minimum 8 caractères.</p>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-[#A1A1AA]">Confirmer le mot de passe</span>
              <input
                type="password"
                value={selfConfirmPasswordDraft}
                onChange={(event) => setSelfConfirmPasswordDraft(event.target.value)}
                className="w-full rounded-md border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
                placeholder="Retaper le mot de passe"
                autoComplete="new-password"
              />
              {selfPasswordMismatch && (
                <p className="mt-1 text-[11px] text-[#FCA5A5]">Les mots de passe ne correspondent pas.</p>
              )}
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[#D4D4D8]">
              <input
                type="checkbox"
                checked={selfRevokeSessions}
                onChange={(event) => setSelfRevokeSessions(event.target.checked)}
              />
              Révoquer mes sessions actives
            </label>

            <button
              type="button"
              disabled={resetAdminPassword.isPending || !canSubmitSelfPassword}
              onClick={() => void handleSelfPasswordChange()}
              className="rounded-md border border-[#3B4A1F] bg-[#1B2310] px-3 py-1.5 text-xs font-semibold text-[#BEF264] disabled:opacity-50"
            >
              {resetAdminPassword.isPending ? "Mise à jour..." : "Mettre à jour mon mot de passe"}
            </button>
          </div>

          {!adminWhoami.isLoading &&
            !adminUsers.isLoading &&
            !authUser &&
            !effectiveCurrentUserId && (
            <p className="mt-2 text-[11px] text-[#FCA5A5]">
              Utilisateur courant introuvable dans la liste. Utiliser le flux “Mot de passe oublié”.
            </p>
            )}
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
