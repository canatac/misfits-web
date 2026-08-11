"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAdminChangeRequest,
  createAdminUser,
  deleteAdminUser,
  getAdminAiActivity,
  getAdminChangelog,
  getAdminUsers,
  getChangeRequests,
  transitionAdminChangeRequest,
  updateAdminUser,
} from "@/lib/admin-ops-api";
import type {
  CreateAdminUserInput,
  CreateChangeRequestInput,
  DeleteAdminUserInput,
  TransitionChangeRequestInput,
  UpdateAdminUserInput,
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

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    refetchInterval: REFRESH_30S,
    staleTime: 10_000,
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
