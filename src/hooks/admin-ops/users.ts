"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminAiActivity,
  getAdminAuditLog,
  getAdminUsers,
  getAdminWhoami,
  inviteAdminUser,
  resetAdminPassword,
  updateAdminUser,
} from "@/lib/admin-ops-api";
import type {
  CreateAdminUserInput,
  DeleteAdminUserInput,
  UpdateAdminUserInput,
} from "@/types/admin-ops";

const REFRESH_30S = 30_000;

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

/**
 * Whoami query — introduced in backend PR1 (RBAC foundation).
 *
 * Consumed by the admin console to decide whether to render CRUD affordances.
 * Cached longer than the other admin queries because it changes only on
 * login/logout, never on background writes.
 */
export function useAdminWhoami() {
  return useQuery({
    queryKey: ["admin", "whoami"],
    queryFn: getAdminWhoami,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Audit trail — introduced in backend PR4. Refreshes on a slow cadence
 * (60s) because entries are appended by other admin actions and don't
 * need to be near-realtime.
 */
export function useAdminAuditLog(limit = 100) {
  return useQuery({
    queryKey: ["admin", "audit-log", limit],
    queryFn: () => getAdminAuditLog({ limit }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useInviteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inviteAdminUser(id),
    onSuccess: (data) => {
      toast.success(
        `Invitation envoyée. Le lien expire le ${new Date(
          data.expiresAt
        ).toLocaleString()}`
      );
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit-log"] });
    },
    onError: (err: Error) => {
      toast.error(`Échec invitation : ${err.message}`);
    },
  });
}

export function useResetAdminPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      newPassword,
      revokeSessions,
    }: {
      id: string;
      newPassword?: string;
      revokeSessions?: boolean;
    }) => resetAdminPassword(id, { newPassword, revokeSessions }),
    onSuccess: (data) => {
      if (data.generated && data.password) {
        // Toast persistant avec le mot de passe temporaire — l'admin doit
        // le communiquer au propriétaire du compte HORS-BANDE (SMS, canal
        // sécurisé) puis exiger un changement à la prochaine connexion.
        toast.success(
          `Mot de passe temporaire : ${data.password} (à communiquer hors-bande)`,
          {
            duration: Infinity,
            action: {
              label: "Copier",
              onClick: () => {
                void navigator.clipboard.writeText(data.password ?? "");
              },
            },
          }
        );
      } else {
        toast.success("Mot de passe réinitialisé");
      }
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit-log"] });
    },
    onError: (err: Error) => {
      toast.error(`Échec réinitialisation : ${err.message}`);
    },
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAdminUserInput) => updateAdminUser(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Utilisateur mis à jour.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Mise à jour utilisateur impossible.");
    },
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminUserInput) => createAdminUser(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Utilisateur créé.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Création utilisateur impossible.");
    },
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteAdminUserInput) => deleteAdminUser(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Utilisateur supprimé.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Suppression utilisateur impossible.");
    },
  });
}

export function useAdminAiActivity(limit = 40) {
  return useQuery({
    queryKey: ["admin", "ai-activity", limit],
    queryFn: () => getAdminAiActivity(limit),
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}
