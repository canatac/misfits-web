"use client";

// UsersTab.tsx — extracted from admin-console-page.tsx Sprint 3
import { useState, type FormEvent } from "react";
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

  async function handleUserRoleChange(id: string, role: AdminUserRecord["role"]) {
    await updateAdminUser.mutateAsync({ id, role });
  }
  async function handleUserStatusChange(id: string, status: AdminUserRecord["status"]) {
    await updateAdminUser.mutateAsync({ id, status });
  }
  async function handleDeleteUser(id: string) {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    deleteAdminUser.mutate({ id });
  }
  function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createAdminUser.mutate({
      ...newAdminUser,
      displayName: newAdminUser.displayName?.trim() || undefined,
    });
    setNewAdminUser({ email: "", role: "user", status: "active", displayName: "" });
  }

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
        <form
          onSubmit={(e) => void handleCreateUser(e)}
          className="mb-4 rounded-xl border border-[#232327] bg-[#151518] p-3"
        >
          <p className="text-xs text-[#A1A1AA]">Créer un utilisateur</p>
          <div className="mt-2 grid gap-2 md:grid-cols-5">
            <input
              value={newAdminUser.email}
              onChange={(e) => setNewAdminUser((prev) => ({ ...prev, email: e.target.value }))}
              required
              type="email"
              className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
              placeholder="email@misfits.ai"
            />
            <input
              value={newAdminUser.displayName || ""}
              onChange={(e) => setNewAdminUser((prev) => ({ ...prev, displayName: e.target.value }))}
              className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
              placeholder="Nom affiché"
            />
            <select
              value={newAdminUser.role}
              onChange={(e) =>
                setNewAdminUser((prev) => ({ ...prev, role: e.target.value as AdminUserRecord["role"] }))
              }
              className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
            >
              <option value="user">user</option>
              <option value="support">support</option>
              <option value="admin">admin</option>
            </select>
            <select
              value={newAdminUser.status}
              onChange={(e) =>
                setNewAdminUser((prev) => ({ ...prev, status: e.target.value as AdminUserRecord["status"] }))
              }
              className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#D4D4D8]"
            >
              <option value="active">active</option>
              <option value="restricted">restricted</option>
            </select>
            <button
              type="submit"
              disabled={createAdminUser.isPending}
              className="rounded-lg border border-[#3A3A42] px-2 py-1.5 text-xs text-[#E4E4E7] disabled:opacity-50"
            >
              {createAdminUser.isPending ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
        )}

        <UsersAiActivityCard adminAiActivity={adminAiActivity} />

        <div className="space-y-3">
          {(adminUsers.data?.users ?? []).map((user) => (
            <article key={user.id} className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[#E4E4E7]">{user.displayName || user.email}</p>
                  <p className="text-xs text-[#71717A]">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={user.status}
                    onChange={(e) => void handleUserStatusChange(user.id, e.target.value as AdminUserRecord["status"])}
                    disabled={updateAdminUser.isPending || !canWriteUsers}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]"
                  >
                    <option value="active">active</option>
                    <option value="restricted">restricted</option>
                  </select>
                  <Badge tone={user.twoFactorEnabled ? "ok" : "warn"}>
                    2FA {user.twoFactorEnabled ? "on" : "off"}
                  </Badge>
                  <select
                    value={user.role}
                    onChange={(e) => void handleUserRoleChange(user.id, e.target.value as AdminUserRecord["role"])}
                    disabled={updateAdminUser.isPending || !canWriteUsers}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]"
                  >
                    <option value="user">user</option>
                    <option value="support">support</option>
                    <option value="admin">admin</option>
                  </select>
                  {canWriteUsers && (
                  <button type="button" onClick={() => inviteAdminUser.mutate(user.id)}
                    disabled={inviteAdminUser.isPending}
                    className="rounded-md border border-[#1F3B5B] px-2 py-1 text-[11px] text-[#93C5FD] disabled:opacity-50"
                    title="Envoyer un lien d'invitation (72h)"
                  >Inviter</button>
                  )}
                  {canWriteUsers && (
                  <button type="button" onClick={() => {
                    const p = window.prompt("Nouveau mot de passe (vide = générer)", "");
                    if (p === null) return;
                    resetAdminPassword.mutate({ id: user.id, newPassword: p.trim() || undefined, revokeSessions: true });
                  }}
                    disabled={resetAdminPassword.isPending}
                    className="rounded-md border border-[#3B4A1F] px-2 py-1 text-[11px] text-[#BEF264] disabled:opacity-50"
                    title="Réinitialiser mot de passe + révoquer sessions"
                  >Reset MDP</button>
                  )}
                  {canWriteUsers && (
                  <button type="button" onClick={() => void handleDeleteUser(user.id)}
                    disabled={deleteAdminUser.isPending}
                    className="rounded-md border border-[#5B1F27] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
                  >Supprimer</button>
                  )}
                </div>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-[#A1A1AA] md:grid-cols-4">
                <p>Dernier login: {asDate(user.lastLoginAt || "")}</p>
                <p>Dernière activité: {asDate(user.lastActivityAt || "")}</p>
                <p>Sessions 24h: {asInt(user.sessions24h)}</p>
                <p>Actions 7j: {asInt(user.actions7d)}</p>
              </div>
              <div className="mt-2">
                <p className="text-xs text-[#A1A1AA]">Activité récente</p>
                <div className="mt-1 space-y-1">
                  {user.recentActivity.slice(0, 3).map((evt, index) => (
                    <p key={`${user.id}_${index}`} className="text-xs text-[#D4D4D8]">
                      {asDate(evt.at)} · {evt.kind} · {evt.label}
                    </p>
                  ))}
                </div>
              </div>
            </article>
          ))}

          {adminUsers.isError && (
            <p className="text-sm text-[#FCA5A5]">Erreur users: {adminUsers.error.message}</p>
          )}
          {adminAiActivity.isError && (
            <p className="text-sm text-[#FCA5A5]">Erreur activité IA: {adminAiActivity.error.message}</p>
          )}

          <UsersAuditLogCard adminAuditLog={adminAuditLog} />
        </div>
    </section>
  );
}
