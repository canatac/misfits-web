"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAdminChangeRequest,
  createAdminUser,
  deleteAdminChangeRequest,
  deleteAdminUser,
  getAdminAiActivity,
  getAdminAuditLog,
  getAdminChangelog,
  getAdminUsers,
  getAdminWhoami,
  getChangeRequests,
  inviteAdminUser,
  resetAdminPassword,
  transitionAdminChangeRequest,
  updateAdminUser,
} from "@/lib/admin-ops-api";
import type {
  CreateAdminUserInput,
  CreateChangeRequestInput,
  DeleteAdminUserInput,
  StartImplementationChangeRequestInput,
  TransitionChangeRequestInput,
  UpdateAdminUserInput,
  WorkflowStatus,
} from "@/types/admin-ops";

const REFRESH_30S = 30_000;

export function useAdminChangelog() {
  return useQuery({
    queryKey: ["admin", "changelog"],
    queryFn: getAdminChangelog,
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useChangeRequests() {
  return useQuery({
    queryKey: ["admin", "change-requests"],
    queryFn: getChangeRequests,
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
  });
}

export function useCreateChangeRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChangeRequestInput) =>
      createAdminChangeRequest(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "change-requests"] });
      toast.success("Change request créée et ajoutée au workflow.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Création impossible.");
    },
  });
}

export function useTransitionChangeRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: TransitionChangeRequestInput) =>
      transitionAdminChangeRequest(payload),
    onSuccess: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "change-requests"] }),
        qc.invalidateQueries({ queryKey: ["admin", "changelog"] }),
      ]);
      toast.success("Workflow mis à jour.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Transition impossible.");
    },
  });
}

export function useDeleteChangeRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminChangeRequest(id),
    onSuccess: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "change-requests"] }),
        qc.invalidateQueries({ queryKey: ["admin", "changelog"] }),
      ]);
      toast.success("Change request supprimée.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Suppression impossible.");
    },
  });
}

const WORKFLOW_ORDER: WorkflowStatus[] = [
  "submitted",
  "triaged",
  "planned",
  "in_progress",
  "qa",
  "released",
  "rejected",
];

export function useStartImplementationChangeRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StartImplementationChangeRequestInput) => {
      const { id, currentStatus, note, actor } = payload;

      if (["released", "rejected", "qa"].includes(currentStatus)) {
        throw new Error(
          "La demande ne peut pas démarrer l’implémentation depuis ce statut."
        );
      }

      let status: WorkflowStatus = currentStatus;
      let lastItem:
        | Awaited<ReturnType<typeof transitionAdminChangeRequest>>["item"]
        | null = null;
      let steps = 0;

      while (status !== "in_progress" && steps < WORKFLOW_ORDER.length) {
        const response = await transitionAdminChangeRequest({
          id,
          action: "advance",
          note:
            steps === 0
              ? note?.trim() ||
                "Implémentation déclenchée depuis la console admin"
              : undefined,
          actor,
        });

        lastItem = response.item;
        status = response.item.status;
        steps += 1;

        if (status === "released" || status === "rejected") {
          break;
        }
      }

      if (!lastItem) {
        throw new Error("Aucune transition exécutée.");
      }

      if (lastItem.status !== "in_progress") {
        throw new Error(
          "Échec du déclenchement: la demande n’est pas passée en in_progress."
        );
      }

      return { item: lastItem, steps };
    },
    onSuccess: (result) => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "change-requests"] }),
        qc.invalidateQueries({ queryKey: ["admin", "changelog"] }),
      ]);
      toast.success(
        `Implémentation déclenchée (${result.steps} transition${
          result.steps > 1 ? "s" : ""
        }).`
      );
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Déclenchement de l’implémentation impossible."
      );
    },
  });
}

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
