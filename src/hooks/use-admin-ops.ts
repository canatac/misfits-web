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


export {
  useAdminUsers,
  useAdminWhoami,
  useAdminAuditLog,
  useInviteAdminUser,
  useResetAdminPassword,
  useUpdateAdminUser,
  useCreateAdminUser,
  useDeleteAdminUser,
  useAdminAiActivity,
} from "./admin-ops/users";
