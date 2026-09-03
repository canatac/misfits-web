"use client";

import type { AdminUserRecord } from "@/types/admin-ops";
import { Badge, asDate, asInt } from "../../shared";

interface UserListItemProps {
  user: AdminUserRecord;
  draft: Pick<AdminUserRecord, "role" | "status">;
  canWriteUsers: boolean;
  updatePending: boolean;
  invitePending: boolean;
  resetPending: boolean;
  deletePending: boolean;
  onDraftStatusChange: (id: string, status: AdminUserRecord["status"]) => void;
  onDraftRoleChange: (id: string, role: AdminUserRecord["role"]) => void;
  onSave: (user: AdminUserRecord) => void;
  onOpenActivity: (user: AdminUserRecord) => void;
  onInvite: (id: string) => void;
  onOpenReset: (user: AdminUserRecord) => void;
  onOpenDelete: (user: AdminUserRecord) => void;
}

export function UserListItem({
  user,
  draft,
  canWriteUsers,
  updatePending,
  invitePending,
  resetPending,
  deletePending,
  onDraftStatusChange,
  onDraftRoleChange,
  onSave,
  onOpenActivity,
  onInvite,
  onOpenReset,
  onOpenDelete,
}: UserListItemProps) {
  const hasDraftChanges = draft.role !== user.role || draft.status !== user.status;

  return (
    <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[#E4E4E7]">{user.displayName || user.email}</p>
          <p className="text-xs text-[#71717A]">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={draft.status}
            onChange={(e) => onDraftStatusChange(user.id, e.target.value as AdminUserRecord["status"])}
            disabled={updatePending || !canWriteUsers}
            className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]"
          >
            <option value="active">active</option>
            <option value="restricted">restricted</option>
          </select>

          <Badge tone={user.twoFactorEnabled ? "ok" : "warn"}>
            2FA {user.twoFactorEnabled ? "on" : "off"}
          </Badge>

          <select
            value={draft.role}
            onChange={(e) => onDraftRoleChange(user.id, e.target.value as AdminUserRecord["role"])}
            disabled={updatePending || !canWriteUsers}
            className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1 text-xs text-[#D4D4D8]"
          >
            <option value="user">user</option>
            <option value="support">support</option>
            <option value="admin">admin</option>
          </select>

          {canWriteUsers && (
            <button
              type="button"
              onClick={() => onSave(user)}
              disabled={updatePending || !hasDraftChanges}
              className="rounded-md border border-[#27435E] px-2 py-1 text-[11px] text-[#93C5FD] disabled:opacity-50"
              title="Enregistrer rôle/statut"
            >
              {updatePending ? "Maj..." : "Enregistrer"}
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenActivity(user)}
            className="rounded-md border border-[#3A3A42] px-2 py-1 text-[11px] text-[#D4D4D8]"
            title="Voir l'activité détaillée"
          >
            Voir activité
          </button>

          {canWriteUsers && (
            <button
              type="button"
              onClick={() => onInvite(user.id)}
              disabled={invitePending}
              className="rounded-md border border-[#1F3B5B] px-2 py-1 text-[11px] text-[#93C5FD] disabled:opacity-50"
              title="Envoyer un lien d'invitation (72h)"
            >
              Inviter
            </button>
          )}

          {canWriteUsers && (
            <button
              type="button"
              onClick={() => onOpenReset(user)}
              disabled={resetPending}
              className="rounded-md border border-[#3B4A1F] px-2 py-1 text-[11px] text-[#BEF264] disabled:opacity-50"
              title="Réinitialiser mot de passe + révoquer sessions"
            >
              Reset MDP
            </button>
          )}

          {canWriteUsers && (
            <button
              type="button"
              onClick={() => onOpenDelete(user)}
              disabled={deletePending}
              className="rounded-md border border-[#5B1F27] px-2 py-1 text-[11px] text-[#FCA5A5] disabled:opacity-50"
            >
              Supprimer
            </button>
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
  );
}
